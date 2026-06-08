export {};

declare module 'storybook/internal/csf' {
	interface ComponentAnnotations {
		/**
		 * Additional terms that match this component in Storybook sidebar search.
		 */
		synonyms?: string[];
	}
}
