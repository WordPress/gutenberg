/**
 * The properties of a post the template field reads.
 */
export interface PostWithTemplate {
	id: number | string;
	type: string;
	slug?: string;
	template?: string;
	/**
	 * The templates a classic theme offers for the post, as slug and title
	 * pairs. Block themes do not send it.
	 */
	available_templates?: Record< string, string >;
}
