/**
 * 用 Monaco 的 colorize 为 Agent 结果卡片生成行级 HTML（与主编辑器主题一致）。
 */
import * as monaco from 'monaco-editor';

const EXT_TO_LANG: Record<string, string> = {
	ts: 'typescript',
	tsx: 'typescript',
	js: 'javascript',
	jsx: 'javascript',
	mjs: 'javascript',
	cjs: 'javascript',
	json: 'json',
	md: 'markdown',
	css: 'css',
	scss: 'scss',
	less: 'less',
	html: 'html',
	htm: 'html',
	xml: 'xml',
	yml: 'yaml',
	yaml: 'yaml',
	py: 'python',
	rs: 'rust',
	go: 'go',
	java: 'java',
	cs: 'csharp',
	kt: 'kotlin',
	swift: 'swift',
	rb: 'ruby',
	php: 'php',
	sql: 'sql',
	sh: 'shell',
	bash: 'shell',
	zsh: 'shell',
	ps1: 'powershell',
	psm1: 'powershell',
	vue: 'html',
	svelte: 'html',
	c: 'c',
	cpp: 'cpp',
	cc: 'cpp',
	cxx: 'cpp',
	h: 'c',
	hpp: 'cpp',
	ini: 'ini',
	toml: 'ini',
};

export function languageIdFromPath(filePath: string): string {
	const base = filePath.split(/[/\\]/).pop() ?? '';
	const dot = base.lastIndexOf('.');
	if (dot <= 0) return 'plaintext';
	const ext = base.slice(dot + 1).toLowerCase();
	return EXT_TO_LANG[ext] ?? 'plaintext';
}

function splitMonacoColorizedHtml(html: string): string[] {
	const parts = html.split(/<br\s*\/?>/i);
	while (parts.length && parts[parts.length - 1]!.trim() === '') {
		parts.pop();
	}
	return parts;
}

/** 将多行文本一次性着色，再按行拆开（保留跨行 token 状态） */
export async function colorizeJoinedLines(lines: string[], languageId: string): Promise<string[] | null> {
	if (lines.length === 0) return [];
	const text = lines.join('\n');
	try {
		monaco.editor.setTheme('void-dark');
		const html = await monaco.editor.colorize(text, languageId, { tabSize: 2 });
		let out = splitMonacoColorizedHtml(html);
		if (out.length < lines.length) {
			while (out.length < lines.length) out.push('');
		} else if (out.length > lines.length) {
			out = out.slice(0, lines.length);
		}
		return out;
	} catch {
		return null;
	}
}

/** search 每行可能来自不同扩展名：对 match 片段按行文件路径着色 */
export async function colorizeSearchMatchLines(
	lines: readonly { matchText?: string; filePath?: string }[]
): Promise<(string | null)[] | null> {
	if (lines.length === 0) return [];
	try {
		monaco.editor.setTheme('void-dark');
		const results = await Promise.all(
			lines.map(async (l) => {
				const text = l.matchText ?? '';
				if (!text) return '';
				const lang = l.filePath ? languageIdFromPath(l.filePath) : 'plaintext';
				const html = await monaco.editor.colorize(text, lang, { tabSize: 2 });
				const parts = splitMonacoColorizedHtml(html);
				return parts[0] ?? html.replace(/<br\s*\/?>\s*$/i, '');
			})
		);
		return results;
	} catch {
		return null;
	}
}
