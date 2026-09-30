/**
 * The properties of an attachment the fields of the collection read.
 */
export interface MediaItem {
	post?: number;
	title?: string | { raw?: string; rendered?: string };
	mime_type?: string;
	media_type?: string;
	alt_text?: string;
	caption?: string | { raw?: string; rendered?: string };
	description?: string | { raw?: string; rendered?: string };
	source_url?: string;
	_embedded?: {
		author?: {
			name?: string;
			avatar_urls?: Record< string, string >;
		}[];
		'wp:attached-to'?: {
			id?: number;
			type?: string;
			title?: string | { rendered?: string; raw?: string };
		}[];
	};
	media_details?: {
		width?: number;
		height?: number;
		filesize?: number;
	};
}
