/**
 * The properties of a post the date field reads.
 */
export interface PostWithDate {
	date?: string;
	modified?: string;
	status?: string;
	_links?: Record< string, unknown >;
}
