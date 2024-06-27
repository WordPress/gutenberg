type PostStatus =
	| 'published'
	| 'draft'
	| 'pending'
	| 'private'
	| 'future'
	| 'auto-draft'
	| 'trash';

type ReservedPostTypes = 'template' | 'template-part';

export interface BasePost {
	status?: PostStatus;
	title: string | { rendered: string };
}

export interface TemplateOrTemplatePart extends BasePost {
	type: 'template' | 'template-part';
	source: string;
	has_theme_file: boolean;
}

export interface OtherPost extends BasePost {
	type: Exclude< string, ReservedPostTypes >;
}

export type Post = TemplateOrTemplatePart | OtherPost;
