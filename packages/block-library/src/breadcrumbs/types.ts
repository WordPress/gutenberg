import type { BlockEditProps } from '@wordpress/blocks';

export interface BreadcrumbsAttributes extends Record< string, unknown > {
	separator: string;
	showHomeItem: boolean;
	showCurrentItem: boolean;
	prefersTaxonomy: boolean;
	showOnHomePage: boolean;
}

export interface BreadcrumbsContext {
	postId?: number;
	postType?: string;
	templateSlug?: string;
}

export type BreadcrumbsEditProps = BlockEditProps< BreadcrumbsAttributes > & {
	name?: string;
	context: BreadcrumbsContext;
};
