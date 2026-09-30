/**
 * Options passed to `pickPosts`.
 */
export interface PostPickerConfig {
	/**
	 * The post type to pick from, or a list of post types. With more than one,
	 * the modal shows a control for switching between them.
	 */
	postType: string | string[];

	/**
	 * Whether more than one post can be selected. Defaults to `false`.
	 */
	multiple?: boolean;

	/**
	 * IDs of posts to show as selected when the modal opens.
	 */
	value?: number[];

	/**
	 * Extra REST query arguments, e.g. `{ exclude: [ 1 ] }` or
	 * `{ status: [ 'publish', 'draft' ] }`.
	 */
	query?: Record< string, unknown >;

	/**
	 * The modal title.
	 */
	title?: string;

	/**
	 * The label of the button that confirms the selection.
	 */
	selectLabel?: string;
}

/**
 * A post record as returned by the REST API. Only the properties the picker
 * relies on are typed.
 */
export interface PostPickerPost {
	id: number;
	type: string;
	title?: {
		raw?: string;
		rendered: string;
	};
	[ key: string ]: unknown;
}

export interface PostPickerRequest {
	id: number;
	config: PostPickerConfig;
}

export interface State {
	request: PostPickerRequest | null;
}
