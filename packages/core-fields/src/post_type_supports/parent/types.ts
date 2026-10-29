/**
 * The properties of a post the parent field reads.
 */
export interface PostWithParent {
	id: number;
	type: string;
	parent?: number;
	title?: string | { rendered?: string; raw?: string };
}
