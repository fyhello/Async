export type ThreadInfo = {
	id: string;
	title: string;
	updatedAt: number;
	createdAt?: number;
	previewCount: number;
	hasUserMessages?: boolean;
	isToday?: boolean;
	isAwaitingReply?: boolean;
	hasAgentDiff?: boolean;
	additions?: number;
	deletions?: number;
	filePaths?: string[];
	fileCount?: number;
	subtitleFallback?: string;
	tokenUsage?: { totalInput: number; totalOutput: number };
	fileStateCount?: number;
};

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export function normalizeThreadRow(t: ThreadInfo): ThreadInfo {
	return {
		...t,
		hasUserMessages: t.hasUserMessages ?? false,
		isToday: typeof t.isToday === 'boolean' ? t.isToday : true,
		isAwaitingReply: t.isAwaitingReply ?? false,
		hasAgentDiff: t.hasAgentDiff ?? false,
		additions: t.additions ?? 0,
		deletions: t.deletions ?? 0,
		filePaths: t.filePaths ?? [],
		fileCount: t.fileCount ?? 0,
		subtitleFallback: t.subtitleFallback ?? '',
		tokenUsage: t.tokenUsage,
		fileStateCount: t.fileStateCount ?? 0,
	};
}
