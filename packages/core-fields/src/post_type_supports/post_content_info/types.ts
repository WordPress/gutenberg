/**
 * The properties of a post the content information field reads: its
 * content, or, in the editor, a function returning the edited content, and
 * when it was last modified.
 */
export interface PostWithContent {
	content?:
		| string
		| { raw?: string; rendered?: string }
		| ( ( record: PostWithContent ) => string );
	modified?: string;
}
