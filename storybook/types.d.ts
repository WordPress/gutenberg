export {};

declare module 'storybook/internal/types' {
	interface Parameters {
		componentStatus?: {
			status:
				| 'stable'
				| 'use-with-caution'
				| 'not-recommended'
				| 'unaudited';
			whereUsed: 'global' | 'editor';
			notes?: string;
		};
	}
}
