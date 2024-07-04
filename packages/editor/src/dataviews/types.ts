type PostStatus =
	| 'published'
	| 'draft'
	| 'pending'
	| 'private'
	| 'future'
	| 'auto-draft'
	| 'trash';

export interface BasePost {
	status?: PostStatus;
	title: string | { rendered: string };
	type: string;
	id: string | number;
}
export interface TemplateOrTemplatePart extends BasePost {
	type: 'wp_template' | 'wp_template_part';
	source: string;
	has_theme_file: boolean;
	id: string;
}

export type Post = TemplateOrTemplatePart | BasePost;

// Will be unnecessary after typescript 5.0 upgrade.
export type CoreDataError = { message?: string; code?: string };
