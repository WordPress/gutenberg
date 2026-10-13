/**
 * The types of the posts the actions act on, copied from `@wordpress/fields`.
 */

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

interface TemplateAuthorFields {
	author?: number;
	author_text: string;
	original_source?: 'theme' | 'plugin' | 'site' | 'user';
}

export interface Template extends CommonPost, TemplateAuthorFields {
	type: 'wp_template';
	is_custom: boolean;
	source: string;
	origin: string;
	plugin?: string;
	has_theme_file: boolean;
	id: string;
	description?: string;
}

export interface TemplatePart extends CommonPost, TemplateAuthorFields {
	type: 'wp_template_part';
	source: string;
	origin: string;
	has_theme_file: boolean;
	id: string;
	area: string;
	plugin?: string;
}

export interface Pattern extends CommonPost {
	slug: string;
	title: { raw: string };
	excerpt?: string | { raw: string; rendered: string };
	meta?: Record< string, any >;
	wp_pattern_sync_status?: string;
}

export type Post = Template | TemplatePart | Pattern | BasePost;

export type PostWithPermissions = Post & {
	permissions: {
		delete: boolean;
		update: boolean;
	};
};

// Will be unnecessary after typescript 5.0 upgrade.
export type CoreDataError = { message?: string; code?: string };
