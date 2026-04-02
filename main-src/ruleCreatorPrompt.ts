/** /create-rule 向导：注入系统提示，引导在 Async 中编写 Rule */

import type { AgentRuleScope } from './agentSettingsTypes.js';

export function formatRuleCreatorUserBubble(
	ruleScope: AgentRuleScope,
	globPattern: string | undefined,
	lang: 'zh-CN' | 'en',
	userNote: string
): string {
	const scopeLabel =
		ruleScope === 'always'
			? lang === 'en'
				? '[Create Rule · Always]'
				: '[创建 Rule · 始终附加]'
			: ruleScope === 'glob'
				? lang === 'en'
					? '[Create Rule · Glob]'
					: '[创建 Rule · 路径 Glob]'
				: lang === 'en'
					? '[Create Rule · Manual @]'
					: '[创建 Rule · 手动 @]';
	const globLine =
		ruleScope === 'glob' && globPattern?.trim()
			? lang === 'en'
				? `Glob: ${globPattern.trim()}`
				: `Glob：${globPattern.trim()}`
			: '';
	const b = userNote.trim();
	const parts = [scopeLabel, globLine, b].filter((x) => x.length > 0);
	return parts.join('\n');
}

export function buildRuleCreatorSystemAppend(
	ruleScope: AgentRuleScope,
	globPattern: string | undefined,
	lang: 'zh-CN' | 'en',
	workspaceRoot: string | null
): string {
	const globHint =
		ruleScope === 'glob'
			? lang === 'en'
				? `The user chose **glob-scoped** rules. Target glob (relative to workspace): \`${(globPattern ?? '').trim() || '(user should refine)'}\`. Explain how it maps to Async **Settings → Agent → Rules** with scope "glob".`
				: `用户选择 **Glob 范围** 规则。目标 glob（相对工作区）：\`${(globPattern ?? '').trim() || '（请与用户确认）'}\`。说明如何对应 Async **设置 → Agent → Rules** 中的「Glob」范围与填写方式。`
			: '';

	const scopeBlock =
		ruleScope === 'always'
			? lang === 'en'
				? '**Scope: Always attach.** Rules apply to every turn without path matching. Prefer describing entries in Async user-level or project-level Rules lists.'
				: '**范围：始终附加。** 规则在每次对话中生效，不按路径匹配。优先说明如何写入 Async 用户级或项目级 Rules 列表。'
			: ruleScope === 'glob'
				? globHint
				: lang === 'en'
					? '**Scope: Manual @ only.** The rule is injected only when the user @-mentions it by name/id in the composer. Describe naming and how to add the rule in Settings.'
					: '**范围：仅手动 @。** 仅在用户在输入框 @ 引用该规则 id/名称时注入。说明命名约定及在设置中添加 Rule 的步骤。';

	const core =
		lang === 'en'
			? `You are the **Rule Author** wizard for Async. The user's request is in their message after the scope tag.

Your job:
1. Confirm understanding; ask concise clarifications (rule name, when it applies, concrete do/don't examples).
2. Propose rule **content** ready to paste into Async (Markdown/plain text). Mention **scope** (${ruleScope}) and glob if relevant.
3. Mention \`.cursor/rules\` or \`.async\` project files only if the user wants on-disk layout; default to in-app Settings workflow.
4. Keep output structured with headings.

Workspace root (if any): \`${workspaceRoot ?? '(none)'}\`.

${scopeBlock}`
			: `你是 Async 的 **Rule 编写向导**。用户的具体需求在其消息中（范围标签之后）。

请完成：
1. 确认理解并**简短追问**（规则名称、适用场景、正反例）。
2. 给出可直接填入 Async 的**规则正文**（Markdown/纯文本），并说明**范围**（当前为：${ruleScope}）及 Glob（若适用）。
3. 若用户需要落盘，再提 \`.cursor/rules\` 或 \`.async\`；默认引导使用应用内**设置**。
4. 使用清晰标题与列表。

工作区根目录：\`${workspaceRoot ?? '（无）'}\`。

${scopeBlock}`;

	return `### Async · Rule Creator（内置）\n\n${core}`;
}
