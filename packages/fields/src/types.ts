import type { DataFormControlProps } from '@wordpress/dataviews';

type PostStatus =
	| 'publish'
	| 'draft'
	| 'pending'
	| 'private'
	| 'future'
	| 'auto-draft'
	| 'trash';

export interface CommonPost {
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

export interface Pattern extends CommonPost {
	slug: string;
	title: { raw: string };
	excerpt?: string | { raw: string; rendered: string };
	meta?: Record< string, any >;
	wp_pattern_sync_status?: string;
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

export interface MediaEditProps< Item > extends Pick<
	DataFormControlProps< Item >,
	'data' | 'field' | 'onChange' | 'hideLabelFromVision' | 'validity'
> {
	/**
	 * Array of allowed media types (e.g., ['image', 'video']).
	 * Use ['*'] to allow all file types.
	 *
	 * @default ['image']
	 */
	allowedTypes?: string[];
	/**
	 * Whether to allow multiple media selections.
	 *
	 * @default false
	 */
	multiple?: boolean;
	/**
	 * Whether to render in an expanded form.
	 *
	 * @default false
	 */
	isExpanded?: boolean;
}
