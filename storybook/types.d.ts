export {};

declare module 'storybook/internal/types' {
	interface Parameters {
		componentStatus?: {
			status:
				| 'recommended'
				| 'use-with-caution'
				| 'not-recommended'
				| 'unaudited';
			whereUsed: 'global' | 'editor';
			notes?: string;
		};
	}
}

declare module 'storybook/internal/csf' {
	interface ComponentAnnotations {
		/**
		 * Additional terms that match this component in Storybook sidebar search.
		 */
		synonyms?: string[];
	}
}
