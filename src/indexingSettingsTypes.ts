/** 与主进程 `settings.json` 中 `indexing` 字段对应（渲染端归一化后三项均有布尔值） */

export type IndexingSettingsWire = {
	symbolIndexEnabled?: boolean;
	semanticIndexEnabled?: boolean;
	tsLspEnabled?: boolean;
};

export type IndexingSettingsState = {
	symbolIndexEnabled: boolean;
	semanticIndexEnabled: boolean;
	tsLspEnabled: boolean;
};

export function normalizeIndexingSettings(raw?: IndexingSettingsWire | null): IndexingSettingsState {
	return {
		symbolIndexEnabled: raw?.symbolIndexEnabled !== false,
		semanticIndexEnabled: raw?.semanticIndexEnabled !== false,
		tsLspEnabled: raw?.tsLspEnabled !== false,
	};
}
