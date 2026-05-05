export {};

declare module 'storybook/internal/types' {
	interface Parameters {
		componentStatus?: {
			status:
				| 'stable'
				| 'use-with-caution'
				| 'not-recommended'
				| 'unaudited'
				| 'coming-soon';
			whereUsed: 'global' | 'editor';
			notes?: string;
		};
	}
}
