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
}
export interface TemplateOrTemplatePart extends BasePost {
	type: 'template' | 'template-part';
	source: string;
	has_theme_file: boolean;
}

export type Post = TemplateOrTemplatePart | BasePost;
