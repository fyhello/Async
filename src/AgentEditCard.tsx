import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FileTypeIcon } from './fileTypeIcons';
import type { FileEditSegment } from './agentChatSegments';
import { useI18n } from './i18n';
import { sliceAgentEditPreviewLines } from './pretextLayout';

type Props = {
	edit: FileEditSegment;
	onOpenFile?: (relPath: string, revealLine?: number) => void;
};

function basename(p: string): string {
	const i = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));
	return i >= 0 ? p.slice(i + 1) : p;
}

type PreviewLine = {
	kind: 'add' | 'del';
	text: string;
};

const EDIT_PREVIEW_MAX_BODY_PX = 220;

function buildPreviewLines(edit: FileEditSegment): PreviewLine[] {
	const lines: PreviewLine[] = [];
	if (edit.oldStr) {
		for (const line of edit.oldStr.split('\n')) {
			lines.push({ kind: 'del', text: line });
		}
	}
	if (edit.newStr) {
		for (const line of edit.newStr.split('\n')) {
			lines.push({ kind: 'add', text: line });
		}
	}
	return lines;
}

export function AgentEditCard({ edit, onOpenFile }: Props) {
	const { t } = useI18n();
	const name = basename(edit.path) || t('agent.review.unknownPath');
	const previewLines = useMemo(() => buildPreviewLines(edit), [edit]);
	const [expanded, setExpanded] = useState(false);
	const previewMeasureRef = useRef<HTMLDivElement>(null);
	const [previewInnerWidth, setPreviewInnerWidth] = useState(320);

	useLayoutEffect(() => {
		const el = previewMeasureRef.current;
		if (!el) {
			return;
		}
		const apply = (w: number) => {
			if (w > 0) {
				setPreviewInnerWidth(w);
			}
		};
		apply(el.getBoundingClientRect().width);
		const ro = new ResizeObserver((entries) => {
			const w = entries[0]?.contentRect.width ?? 0;
			apply(w);
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const collapsedHead = useMemo(
		() => sliceAgentEditPreviewLines(previewLines, previewInnerWidth, EDIT_PREVIEW_MAX_BODY_PX, 'head'),
		[previewLines, previewInnerWidth]
	);
	const collapsedTail = useMemo(
		() => sliceAgentEditPreviewLines(previewLines, previewInnerWidth, EDIT_PREVIEW_MAX_BODY_PX, 'tail'),
		[previewLines, previewInnerWidth]
	);

	const canExpand = !edit.isStreaming && previewLines.length > collapsedHead.length;
	// 流式：按像素预算展示尾部若干行；完成后：折叠态展示头部，展开后全文。
	const visibleLines = edit.isStreaming
		? collapsedTail
		: expanded
			? previewLines
			: collapsedHead;
	const canOpenFile = edit.path.trim().length > 0;
	const expandRemainingLines = Math.max(0, previewLines.length - collapsedHead.length);

	return (
		<div className={`ref-edit-card ${edit.isStreaming ? 'ref-edit-card--streaming' : ''}`}>
			<button
				type="button"
				className="ref-edit-card-file"
				title={edit.path}
				onClick={() => {
					if (canOpenFile) {
						onOpenFile?.(edit.path, edit.startLine);
					}
				}}
				disabled={!canOpenFile}
			>
				<FileTypeIcon
					fileName={name}
					isDirectory={false}
					className="ref-edit-card-icon"
				/>
				<span className="ref-edit-card-name">{name}</span>
				{edit.isStreaming ? (
					<span
						className="ref-edit-card-streaming-pulse"
						title={edit.isNew ? t('agent.activity.writing', { path: name }) : t('agent.activity.editing', { path: name })}
					/>
				) : (
					<span className="ref-edit-card-stats">
						{edit.additions > 0 && (
							<span className="ref-fc-add">+{edit.additions}</span>
						)}
						{edit.deletions > 0 && (
							<span className="ref-fc-del">-{edit.deletions}</span>
						)}
					</span>
				)}
			</button>
			{previewLines.length > 0 ? (
				<div className="ref-edit-card-preview-wrap">
					<div ref={previewMeasureRef} className="ref-edit-card-preview">
						{visibleLines.map((line, idx) => (
							<div
								key={`${line.kind}-${idx}`}
								className={`ref-edit-card-preview-line ref-edit-card-preview-line--${line.kind}`}
							>
								<span className="ref-edit-card-preview-sign" aria-hidden>
									{line.kind === 'add' ? '+' : '-'}
								</span>
								<code className="ref-edit-card-preview-code">{line.text || ' '}</code>
							</div>
						))}
					</div>
					{canExpand ? (
						<button
							type="button"
							className="ref-edit-card-toggle"
							onClick={() => setExpanded((v) => !v)}
							aria-expanded={expanded}
						>
							<svg
								className={`ref-fc-chevron ${expanded ? 'ref-fc-chevron--open' : ''}`}
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M6 9l6 6 6-6" />
							</svg>
							<span>
								{expanded
									? t('agent.edit.collapse')
									: t('agent.edit.expand', { lines: expandRemainingLines })}
							</span>
						</button>
					) : null}
				</div>
			) : null}
		</div>
	);
}
