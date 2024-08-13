type PostStatus =
	| 'published'
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
}

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
	_links?: Record< string, { href: string }[] >;
}

export interface Template extends CommonPost {
	type: 'wp_template';
	is_custom: boolean;
	source: string;
	has_theme_file: boolean;
	id: string;
}

export interface TemplatePart extends CommonPost {
	type: 'wp_template_part';
	source: string;
	has_theme_file: boolean;
	id: string;
	area: string;
}

export interface Pattern extends CommonPost {
	slug: string;
	title: { raw: string };
	wp_pattern_sync_status: string;
}

export type Post = Template | TemplatePart | Pattern | BasePost;

export type PostWithPermissions = Post & {
	permissions: {
		delete: boolean;
		update: boolean;
	};
};

export interface PostType {
	slug: string;
	supports?: {
		'page-attributes'?: boolean;
		title?: boolean;
	};
}

// Will be unnecessary after typescript 5.0 upgrade.
export type CoreDataError = { message?: string; code?: string };
