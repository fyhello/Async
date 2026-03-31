import { useCallback, useEffect, useState } from 'react';
import { useI18n } from './i18n';
import type { IndexingSettingsState } from './indexingSettingsTypes';

type IndexingStats = {
	ok?: boolean;
	workspaceRoot?: string | null;
	fileCount?: number;
	symbolUniqueNames?: number;
	symbolIndexedFiles?: number;
	semanticChunks?: number;
	semanticBusy?: boolean;
};

type ShellApi = NonNullable<Window['asyncShell']>;

type Props = {
	value: IndexingSettingsState;
	onChange: (next: IndexingSettingsState) => void;
	/** 切换单项时立即同步主进程（与关闭设置页时的全量保存配合） */
	onPersistPatch: (patch: Partial<IndexingSettingsState>) => void;
	shell: ShellApi | null;
	workspaceOpen: boolean;
};

export function SettingsIndexingPanel({ value, onChange, onPersistPatch, shell, workspaceOpen }: Props) {
	const { t } = useI18n();
	const [stats, setStats] = useState<IndexingStats | null>(null);
	const [statsLoading, setStatsLoading] = useState(false);
	const [rebuildBusy, setRebuildBusy] = useState<'symbols' | 'semantic' | 'all' | null>(null);

	const refreshStats = useCallback(async () => {
		if (!shell) {
			return;
		}
		setStatsLoading(true);
		try {
			const r = (await shell.invoke('workspace:indexing:stats')) as IndexingStats;
			setStats(r?.ok ? r : null);
		} catch {
			setStats(null);
		} finally {
			setStatsLoading(false);
		}
	}, [shell]);

	useEffect(() => {
		void refreshStats();
	}, [refreshStats, workspaceOpen, value.symbolIndexEnabled, value.semanticIndexEnabled]);

	const patchToggle = (key: keyof IndexingSettingsState, on: boolean) => {
		const next = { ...value, [key]: on };
		onChange(next);
		onPersistPatch({ [key]: on });
	};

	const runRebuild = async (target: 'symbols' | 'semantic' | 'all') => {
		if (!shell || !workspaceOpen) {
			return;
		}
		setRebuildBusy(target);
		try {
			await shell.invoke('workspace:indexing:rebuild', { target });
			await refreshStats();
		} finally {
			setRebuildBusy(null);
		}
	};

	return (
		<div className="ref-settings-panel ref-settings-panel--indexing">
			<p className="ref-settings-lead">{t('settings.indexing.lead')}</p>

			<div className="ref-settings-agent-card">
				<div className="ref-settings-agent-card-row">
					<div>
						<div className="ref-settings-agent-card-title">{t('settings.indexing.tsLsp')}</div>
						<p className="ref-settings-agent-card-desc">{t('settings.indexing.tsLspDesc')}</p>
					</div>
					<button
						type="button"
						className={`ref-settings-toggle ${value.tsLspEnabled ? 'is-on' : ''}`}
						role="switch"
						aria-checked={value.tsLspEnabled}
						onClick={() => patchToggle('tsLspEnabled', !value.tsLspEnabled)}
					>
						<span className="ref-settings-toggle-knob" />
					</button>
				</div>
				<div className="ref-settings-agent-card-row" style={{ marginTop: 12 }}>
					<div>
						<div className="ref-settings-agent-card-title">{t('settings.indexing.symbolIndex')}</div>
						<p className="ref-settings-agent-card-desc">{t('settings.indexing.symbolIndexDesc')}</p>
					</div>
					<button
						type="button"
						className={`ref-settings-toggle ${value.symbolIndexEnabled ? 'is-on' : ''}`}
						role="switch"
						aria-checked={value.symbolIndexEnabled}
						onClick={() => patchToggle('symbolIndexEnabled', !value.symbolIndexEnabled)}
					>
						<span className="ref-settings-toggle-knob" />
					</button>
				</div>
				<div className="ref-settings-agent-card-row" style={{ marginTop: 12 }}>
					<div>
						<div className="ref-settings-agent-card-title">{t('settings.indexing.semanticIndex')}</div>
						<p className="ref-settings-agent-card-desc">{t('settings.indexing.semanticIndexDesc')}</p>
					</div>
					<button
						type="button"
						className={`ref-settings-toggle ${value.semanticIndexEnabled ? 'is-on' : ''}`}
						role="switch"
						aria-checked={value.semanticIndexEnabled}
						onClick={() => patchToggle('semanticIndexEnabled', !value.semanticIndexEnabled)}
					>
						<span className="ref-settings-toggle-knob" />
					</button>
				</div>
			</div>

			<h2 className="ref-settings-subhead" style={{ marginTop: 24 }}>
				{t('settings.indexing.statsTitle')}
			</h2>
			<p className="ref-settings-proxy-hint">{t('settings.indexing.statsHint')}</p>
			<div className="ref-settings-indexing-stats">
				{!workspaceOpen ? (
					<p className="ref-settings-proxy-hint">{t('settings.indexing.noWorkspace')}</p>
				) : statsLoading ? (
					<p className="ref-settings-proxy-hint">{t('settings.indexing.statsLoading')}</p>
				) : stats ? (
					<ul className="ref-settings-indexing-stat-list">
						<li>
							{t('settings.indexing.statFiles')}: <strong>{stats.fileCount ?? 0}</strong>
						</li>
						<li>
							{t('settings.indexing.statSymbols')}:{' '}
							<strong>{stats.symbolUniqueNames ?? 0}</strong> ({t('settings.indexing.statSymbolFiles')}:{' '}
							{stats.symbolIndexedFiles ?? 0})
						</li>
						<li>
							{t('settings.indexing.statSemantic')}: <strong>{stats.semanticChunks ?? 0}</strong>
							{stats.semanticBusy ? ` (${t('settings.indexing.statSemanticBusy')})` : ''}
						</li>
					</ul>
				) : (
					<p className="ref-settings-proxy-hint">{t('settings.indexing.statsUnavailable')}</p>
				)}
			</div>
			<div className="ref-settings-indexing-actions">
				<button
					type="button"
					className="ref-settings-add-model"
					disabled={!shell || !workspaceOpen || statsLoading || rebuildBusy !== null || !value.symbolIndexEnabled}
					onClick={() => void runRebuild('symbols')}
				>
					{rebuildBusy === 'symbols' ? t('settings.indexing.rebuilding') : t('settings.indexing.rebuildSymbols')}
				</button>
				<button
					type="button"
					className="ref-settings-add-model"
					disabled={!shell || !workspaceOpen || statsLoading || rebuildBusy !== null || !value.semanticIndexEnabled}
					onClick={() => void runRebuild('semantic')}
				>
					{rebuildBusy === 'semantic' ? t('settings.indexing.rebuilding') : t('settings.indexing.rebuildSemantic')}
				</button>
				<button
					type="button"
					className="ref-settings-add-model"
					disabled={
						!shell ||
						!workspaceOpen ||
						statsLoading ||
						rebuildBusy !== null ||
						!value.symbolIndexEnabled ||
						!value.semanticIndexEnabled
					}
					onClick={() => void runRebuild('all')}
				>
					{rebuildBusy === 'all' ? t('settings.indexing.rebuilding') : t('settings.indexing.rebuildAll')}
				</button>
				<button
					type="button"
					className="ref-settings-set-default"
					disabled={!shell || !workspaceOpen || statsLoading}
					onClick={() => void refreshStats()}
				>
					{t('settings.indexing.refreshStats')}
				</button>
			</div>
		</div>
	);
}
