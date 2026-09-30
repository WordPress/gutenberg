import type { ItemWithTitle } from '../../shared/title/get-item-title';

/**
 * The properties of a post the slug field reads.
 */
export interface PostWithSlug extends ItemWithTitle {
	id?: number;
	slug?: string;
	generated_slug?: string;
	link?: string;
	permalink_template?: string;
}
