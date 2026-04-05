import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GitPathStatusMap } from '../WorkspaceExplorer';

type Shell = NonNullable<Window['asyncShell']>;
type DiffPreview = { diff: string; isBinary: boolean; additions: number; deletions: number };

/**
 * 管理所有 Git 相关状态：分支、状态、diff 预览、分支列表。
 * 在 workspace 变化或文件系统触碰时自动刷新。
 */
export function useGitIntegration(shell: Shell | undefined, workspace: string | null) {
	const [gitBranch, setGitBranch] = useState('—');
	const [gitLines, setGitLines] = useState<string[]>([]);
	const [gitPathStatus, setGitPathStatus] = useState<GitPathStatusMap>({});
	const [gitChangedPaths, setGitChangedPaths] = useState<string[]>([]);
	/** `git:status` 成功（有仓库且本机可执行 git）；否则 Agent 改动条回退为对话解析统计 */
	const [gitStatusOk, setGitStatusOk] = useState(false);
	/** 与 refreshGit 同步预取的本地分支列表（供分支选择器立即展示） */
	const [gitBranchList, setGitBranchList] = useState<string[]>([]);
	const [gitBranchListCurrent, setGitBranchListCurrent] = useState('');
	const [diffPreviews, setDiffPreviews] = useState<Record<string, DiffPreview>>({});
	const [diffLoading, setDiffLoading] = useState(false);
	const [gitActionError, setGitActionError] = useState<string | null>(null);
	const [treeEpoch, setTreeEpoch] = useState(0);
	const [gitBranchPickerOpen, setGitBranchPickerOpen] = useState(false);

	const refreshGit = useCallback(async () => {
		if (!shell) return;
		type StatusR =
			| { ok: true; branch: string; lines: string[]; pathStatus?: GitPathStatusMap; changedPaths?: string[] }
			| { ok: false; error?: string };
		type ListR = { ok: true; branches: string[]; current: string } | { ok: false; error?: string };
		const [r, lb] = (await Promise.all([
			shell.invoke('git:status'),
			shell.invoke('git:listBranches'),
		])) as [StatusR, ListR];
		if (r.ok) {
			setGitStatusOk(true);
			setGitBranch(r.branch || 'master');
			setGitLines(r.lines);
			setGitPathStatus(r.pathStatus ?? {});
			setGitChangedPaths(r.changedPaths ?? []);
			if (lb.ok) {
				setGitBranchList(Array.isArray(lb.branches) ? lb.branches : []);
				setGitBranchListCurrent(typeof lb.current === 'string' ? lb.current : '');
			} else {
				setGitBranchList([]);
				setGitBranchListCurrent('');
			}
		} else {
			setGitStatusOk(false);
			setGitBranch('—');
			setGitLines([r.error ?? 'Failed to load changes']);
			setGitPathStatus({});
			setGitChangedPaths([]);
			setGitBranchList([]);
			setGitBranchListCurrent('');
		}
		setTreeEpoch((n) => n + 1);
	}, [shell]);

	const onGitBranchListFresh = useCallback((b: string[], c: string) => {
		setGitBranchList(b);
		setGitBranchListCurrent(c);
	}, []);

	// workspace 变化时刷新 git 状态
	useEffect(() => {
		if (!workspace || !shell) return;
		void refreshGit();
	}, [workspace, shell, refreshGit]);

	// 文件系统变化时刷新 git 状态
	useEffect(() => {
		const sub = shell?.subscribeWorkspaceFsTouched;
		if (!shell || !sub) return;
		const unsub = sub(() => {
			void refreshGit();
		});
		return unsub;
	}, [shell, refreshGit]);

	// gitChangedPaths → 加载 diff 预览
	const gitPathsKey = useMemo(() => gitChangedPaths.join('\n'), [gitChangedPaths]);

	useEffect(() => {
		if (!shell || gitChangedPaths.length === 0) {
			setDiffPreviews({});
			setDiffLoading(false);
			return;
		}
		setDiffLoading(true);
		let cancelled = false;
		void (async () => {
			const r = (await shell.invoke('git:diffPreviews', gitChangedPaths)) as
				| { ok: true; previews: Record<string, DiffPreview> }
				| { ok: false };
			if (!cancelled && r.ok) setDiffPreviews(r.previews);
			if (!cancelled) setDiffLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [shell, treeEpoch, gitPathsKey]);

	const diffTotals = useMemo(() => {
		let additions = 0,
			deletions = 0;
		for (const p of gitChangedPaths) {
			const pr = diffPreviews[p];
			if (pr) {
				additions += pr.additions;
				deletions += pr.deletions;
			}
		}
		return { additions, deletions };
	}, [gitChangedPaths, diffPreviews]);

	return {
		gitBranch,
		gitLines,
		gitPathStatus,
		gitChangedPaths,
		gitStatusOk,
		gitBranchList,
		gitBranchListCurrent,
		diffPreviews,
		diffLoading,
		gitActionError,
		setGitActionError,
		treeEpoch,
		gitBranchPickerOpen,
		setGitBranchPickerOpen,
		gitPathsKey,
		diffTotals,
		refreshGit,
		onGitBranchListFresh,
	};
}
