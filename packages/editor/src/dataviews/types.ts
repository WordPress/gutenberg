/**
 * The types of the posts the editor fields read, copied from `@wordpress/fields`.
 */

type PostStatus =
	| 'publish'
	| 'draft'
	| 'pending'
	| 'private'
	| 'future'
	| 'auto-draft'
	| 'trash';

interface CommonPost {
	status?: PostStatus;
	title: string | { rendered: string } | { raw: string };
	content: string | { raw: string; rendered: string };
	type: string;
	id: string | number;
	blocks?: Object[];
	_links?: Links;
}

interface Links {
	'predecessor-version'?: { href: string; id: number }[];
	'version-history'?: { href: string; count: number }[];
	[ key: string ]: { href: string }[] | undefined;
}

interface Author {
	id: number;
	name: string;
	avatar_urls: Record< string, string >;
}

interface EmbeddedAuthor {
	author: Author[];
}

/**
 * BasePost interface used for all post types.
 */
export interface BasePost extends CommonPost {
	comment_status?: 'open' | 'closed';
	excerpt?: string | { raw: string; rendered: string };
	meta?: Record< string, any >;
	parent?: number;
	password?: string;
	template?: string;
	format?: string;
	featured_media?: number;
	menu_order?: number;
	ping_status?: 'open' | 'closed';
	link?: string;
	slug?: string;
	generated_slug?: string;
	sticky?: boolean;
	permalink_template?: string;
	date?: string;
	modified?: string;
	author?: number;
}

export interface BasePostWithEmbeddedAuthor extends BasePost {
	_embedded: EmbeddedAuthor;
}

interface EditorSupport {
	notes?: boolean;
}

export interface PostType {
	slug: string;
	viewable: boolean;
	supports?: {
		'page-attributes'?: boolean;
		title?: boolean;
		excerpt?: boolean;
		revisions?: boolean;
		author?: string;
		thumbnail?: string;
		comments?: string;
		editor?: boolean | [ EditorSupport ];
		trackbacks?: boolean;
		'post-formats'?: boolean;
	};
}
