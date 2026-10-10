export type NavigationPostType = 'page' | 'post';
export type NavigationTemplateType = 'wp_template' | 'wp_template_part';

/**
 * The router private APIs consumed by the command palette.
 */
export interface RouterPrivateApis {
	RouterProvider: React.ComponentType< {
		pathArg: string;
		children: React.ReactNode;
	} >;
	useHistory: () => {
		navigate: ( path: string ) => Promise< void >;
	};
}

declare global {
	interface Window {
		/** Whether the extensible site editor is enabled. */
		__experimentalExtensibleSiteEditor?: boolean;
	}
}
