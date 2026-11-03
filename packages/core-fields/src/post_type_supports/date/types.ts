/**
 * The properties of a post the date field reads.
 */
export interface PostWithDate {
	id?: number;
	type?: string;
	date?: string;
	modified?: string;
	status?: string;
	_links?: Record< string, unknown >;
}
