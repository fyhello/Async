/**
 * Cursor 风格的 "Explored N files" 折叠分组。
 *
 * 进行中：展开态，内容区无滚动条但可滚动，内容逐行涌出（由父层 activity 各自渲染）。
 * 完成后：默认折叠，显示摘要行 + 展开按钮；展开后显示所有 activity 详情。
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ActivityGroupSegment, ActivitySegment } from './agentChatSegments';
import { AgentResultCard } from './AgentResultCard';

type Props = {
	group: ActivityGroupSegment;
	onOpenFile?: (relPath: string, revealLine?: number, revealEndLine?: number) => void;
};

export function AgentActivityGroup({ group, onOpenFile }: Props) {
	const wasEverPending = useRef(group.pending);
	if (group.pending) wasEverPending.current = true;

	// 进行中时默认展开；完成后默认折叠
	const [expanded, setExpanded] = useState(group.pending);

	// 当 group 从 pending → done 时自动折叠
	const prevPendingRef = useRef(group.pending);
	useEffect(() => {
		if (prevPendingRef.current && !group.pending) {
			setExpanded(false);
		}
		prevPendingRef.current = group.pending;
	}, [group.pending]);

	// 进行中时内容区自动滚底
	const bodyRef = useRef<HTMLDivElement>(null);
	useLayoutEffect(() => {
		if (!group.pending) return;
		const el = bodyRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [group.items.length, group.pending]);

	return (
		<div className={`ref-activity-group ${group.pending ? 'is-pending' : 'is-done'}`}>
			{/* 摘要行（始终可见） */}
			<button
				type="button"
				className="ref-activity-group-header"
				aria-expanded={expanded}
				onClick={() => setExpanded((v) => !v)}
			>
				<span className="ref-activity-group-icon" aria-hidden>
					{group.pending ? <SpinnerIcon /> : <ExploreIcon />}
				</span>
				<span className="ref-activity-group-summary">{group.summary}</span>
				<span className="ref-activity-group-chevron" aria-hidden>
					<ChevronIcon up={expanded} />
				</span>
			</button>

			{/* 详情区 */}
			{expanded ? (
				<div
					ref={bodyRef}
					className={`ref-activity-group-body ${group.pending ? 'ref-activity-group-body--live' : ''}`}
				>
					{group.items.map((item, i) => (
						<ActivityRow key={i} item={item} onOpenFile={onOpenFile} />
					))}
				</div>
			) : null}
		</div>
	);
}

function ActivityRow({
	item,
	onOpenFile,
}: {
	item: ActivitySegment;
	onOpenFile?: (relPath: string, revealLine?: number, revealEndLine?: number) => void;
}) {
	const readLink = item.agentReadLink;
	return (
		<div className={`ref-activity-group-row ref-activity-group-row--${item.status}`}>
			<span className="ref-activity-group-row-dot" aria-hidden />
			<div className="ref-activity-group-row-content">
				<div className="ref-activity-group-row-main">
					{readLink && onOpenFile ? (
						<button
							type="button"
							className="ref-agent-activity-ref-link"
							onClick={() => onOpenFile(readLink.path, readLink.startLine, readLink.endLine)}
						>
							{item.text}
						</button>
					) : (
						<span>{item.text}</span>
					)}
					{item.summary ? (
						<span className="ref-agent-activity-summary">{item.summary}</span>
					) : null}
				</div>
				{item.detail ? (
					<pre className="ref-agent-activity-detail">{item.detail}</pre>
				) : null}
				{item.resultLines && item.resultLines.length > 0 && item.resultKind ? (
					<AgentResultCard
						lines={item.resultLines}
						kind={item.resultKind}
						readSourcePath={item.agentReadLink?.path}
						onOpenFile={onOpenFile}
					/>
				) : null}
			</div>
		</div>
	);
}

function ExploreIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
			<circle cx="11" cy="11" r="8" />
			<path d="M21 21l-4.35-4.35" />
		</svg>
	);
}

function SpinnerIcon() {
	return (
		<svg className="ref-activity-group-spinner" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
			<path d="M12 2a10 10 0 0 1 10 10" />
		</svg>
	);
}

function ChevronIcon({ up }: { up: boolean }) {
	return (
		<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
			{up ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}
		</svg>
	);
}
