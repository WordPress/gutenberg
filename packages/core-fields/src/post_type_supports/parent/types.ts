/**
 * The properties of a post the parent field reads.
 */
export interface PostWithParent {
	/**
	 * Missing when the record stands for several posts edited at once.
	 */
	id?: number;
	type: string;
	parent?: number;
	title?: string | { rendered?: string; raw?: string };
}
