/** /create-subagent 向导：引导编写 Subagent 角色说明 */

export type SubagentCreatorScope = 'user' | 'project';

export function formatSubagentCreatorUserBubble(
	scope: SubagentCreatorScope,
	lang: 'zh-CN' | 'en',
	userNote: string
): string {
	const head =
		scope === 'project'
			? lang === 'en'
				? '[Create Subagent · This project]'
				: '[创建 Subagent · 本项目]'
			: lang === 'en'
				? '[Create Subagent · All projects]'
				: '[创建 Subagent · 所有项目]';
	const b = userNote.trim();
	return b ? `${head}\n${b}` : head;
}

export function buildSubagentCreatorSystemAppend(
	scope: SubagentCreatorScope,
	lang: 'zh-CN' | 'en',
	workspaceRoot: string | null
): string {
	const scopeBlock =
		scope === 'project'
			? lang === 'en'
				? `**Target: this project.** Prefer adding the subagent to workspace **.async/agent.json** or project-scoped agent settings in Async. Workspace root: \`${workspaceRoot ?? '(none)'}\`.`
				: `**目标：本项目。** 优先写入工作区 **.async/agent.json** 或 Async 中项目级 Subagents。工作区根：\`${workspaceRoot ?? '（无）'}\`。`
			: lang === 'en'
				? '**Target: all projects (user-level).** Describe adding the subagent via Async **Settings → Agent → Subagents** for global use.'
				: '**目标：所有项目（用户级）。** 说明如何通过 Async **设置 → Agent → Subagents** 添加全局子代理。';

	const core =
		lang === 'en'
			? `You are the **Subagent Creator** for Async. The user's notes appear after the scope tag.

Your job:
1. Clarify the role name, when to delegate to this subagent, and boundaries.
2. Output a concise **Subagent spec**: name, one-line description, and detailed instructions (Markdown).
3. Explain how to register it in Async for the chosen scope.

${scopeBlock}`
			: `你是 Async 的 **Subagent 创建向导**。用户的说明在范围标签之后。

请完成：
1. 澄清角色名称、何时委派给该子代理、边界。
2. 输出 **Subagent 规格**：名称、一行描述、详细指令（Markdown）。
3. 说明在所选范围下如何在 Async 中注册。

${scopeBlock}`;

	return `### Async · Subagent Creator（内置）\n\n${core}`;
}
