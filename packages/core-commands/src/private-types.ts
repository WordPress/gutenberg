export type NavigationPostType = 'page' | 'post';
export type NavigationTemplateType = 'wp_template' | 'wp_template_part';

declare global {
	interface Window {
		/** Whether the extensible site editor is enabled. */
		__experimentalExtensibleSiteEditor?: boolean;
	}
}
