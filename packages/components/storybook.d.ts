export {};

declare module 'storybook/internal/types' {
	interface Parameters {
		componentStatus?: {
			status:
				| 'stable'
				| 'use-with-caution'
				| 'not-recommended'
				| 'unaudited';
			/**
			 * - `global`: Intended to be used anywhere.
			 * - `editor`: Intended to be used specifically in the block editor.
			 */
			whereUsed: 'global' | 'editor';
			notes?: string;
		};
	}
}
