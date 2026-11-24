/**
 * The properties of a post the date field reads.
 */
export interface PostWithDate {
	// `null` once the date is reset, until the post is saved.
	date?: string | null;
	modified?: string;
	status?: string;
	_links?: Record< string, unknown >;
}
