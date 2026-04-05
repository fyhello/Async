import { describe, expect, it } from 'vitest';
import { anthropicEffectiveTemperature } from './thinkingLevel.js';

describe('anthropicEffectiveTemperature', () => {
	it('preserves the configured temperature when thinking is disabled', () => {
		expect(anthropicEffectiveTemperature(0.75, null)).toBe(0.75);
		expect(anthropicEffectiveTemperature(0.3, null)).toBe(0.3);
	});

	it('forces temperature to 1 when extended thinking is enabled', () => {
		expect(anthropicEffectiveTemperature(0.75, 4096)).toBe(1);
		expect(anthropicEffectiveTemperature(0.25, 8192)).toBe(1);
	});
});
