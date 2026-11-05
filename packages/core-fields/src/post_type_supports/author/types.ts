/**
 * The properties of a post the author field reads: the id of its author, the
 * author embedded in the REST response, if any, and the action links telling
 * whether the current user can assign an author.
 */
export interface PostWithAuthor {
	author?: number;
	_embedded?: {
		author?: {
			id: number;
			name: string;
			avatar_urls: Record< string, string >;
		}[];
	};
	_links?: Record< string, unknown >;
}
