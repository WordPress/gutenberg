/**
 * A user who can be assigned as the author of a post, with the fields the
 * author control and filter read.
 */
export interface Author {
	id: number;
	name: string;
	avatar_urls?: Record< string, string >;
}

/**
 * The query for the users who can be assigned as authors. The filter elements
 * and the edit control share it, so they share one request.
 */
export const AUTHORS_QUERY = {
	per_page: -1,
	who: 'authors',
	_fields: 'id,name,avatar_urls',
	context: 'view',
} as const;
