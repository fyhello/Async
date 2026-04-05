import { useCallback, useEffect, useRef, useState } from 'react';
import { type ChatMessage, type ThreadInfo, normalizeThreadRow } from '../threadTypes';

type Shell = NonNullable<Window['asyncShell']>;

/**
 * 管理线程列表、当前线程、消息及导航历史。
 * 暴露 resetThreadState() 供切换工作区时统一清空。
 */
export function useThreads(shell: Shell | undefined) {
	const [threads, setThreads] = useState<ThreadInfo[]>([]);
	const [threadSearch, setThreadSearch] = useState('');
	const [currentId, setCurrentId] = useState<string | null>(null);
	const currentIdRef = useRef<string | null>(null);
	currentIdRef.current = currentId;

	const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
	const [editingThreadTitleDraft, setEditingThreadTitleDraft] = useState('');
	const threadTitleDraftRef = useRef('');
	const threadTitleInputRef = useRef<HTMLInputElement>(null);

	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
	const confirmDeleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const messagesRef = useRef(messages);
	messagesRef.current = messages;
	const [messagesThreadId, setMessagesThreadId] = useState<string | null>(null);

	const [resendFromUserIndex, setResendFromUserIndex] = useState<number | null>(null);
	const resendIdxRef = useRef<number | null>(null);
	resendIdxRef.current = resendFromUserIndex;

	const [threadNavigation, setThreadNavigation] = useState<{ history: string[]; index: number }>({
		history: [],
		index: -1,
	});
	const skipThreadNavigationRecordRef = useRef(false);

	// currentId 变化时更新导航历史
	useEffect(() => {
		if (!currentId) return;
		if (skipThreadNavigationRecordRef.current) {
			skipThreadNavigationRecordRef.current = false;
			return;
		}
		setThreadNavigation((prev) => {
			const base = prev.index >= 0 ? prev.history.slice(0, prev.index + 1) : [];
			if (base[base.length - 1] === currentId) return prev;
			const history = [...base, currentId].slice(-40);
			return { history, index: history.length - 1 };
		});
	}, [currentId]);

	// ── 操作 ──────────────────────────────────────────────────────────────────

	const refreshThreads = useCallback(async () => {
		if (!shell) return null;
		const r = (await shell.invoke('threads:list')) as {
			threads: ThreadInfo[];
			currentId: string | null;
		};
		setThreads((r.threads ?? []).map(normalizeThreadRow));
		setCurrentId(r.currentId);
		return r.currentId;
	}, [shell]);

	const loadMessages = useCallback(
		async (id: string) => {
			if (!shell) return;
			const r = (await shell.invoke('threads:messages', id)) as {
				ok: boolean;
				messages?: ChatMessage[];
			};
			if (r.ok && r.messages) {
				if (currentIdRef.current !== id) return;
				setMessages(r.messages);
				setMessagesThreadId(id);
			}
		},
		[shell]
	);

	/** 切换工作区时重置线程域的所有状态 */
	const resetThreadState = useCallback(() => {
		currentIdRef.current = null;
		setThreads([]);
		setCurrentId(null);
		setMessages([]);
		setMessagesThreadId(null);
		setResendFromUserIndex(null);
		setConfirmDeleteId(null);
		setEditingThreadId(null);
		setEditingThreadTitleDraft('');
		threadTitleDraftRef.current = '';
		setThreadNavigation({ history: [], index: -1 });
	}, []);

	return {
		threads,
		setThreads,
		threadSearch,
		setThreadSearch,
		currentId,
		setCurrentId,
		currentIdRef,
		editingThreadId,
		setEditingThreadId,
		editingThreadTitleDraft,
		setEditingThreadTitleDraft,
		threadTitleDraftRef,
		threadTitleInputRef,
		confirmDeleteId,
		setConfirmDeleteId,
		confirmDeleteTimerRef,
		messages,
		setMessages,
		messagesRef,
		messagesThreadId,
		setMessagesThreadId,
		resendFromUserIndex,
		setResendFromUserIndex,
		resendIdxRef,
		threadNavigation,
		setThreadNavigation,
		skipThreadNavigationRecordRef,
		refreshThreads,
		loadMessages,
		resetThreadState,
	};
}
