/**
 * The properties of a template the template author field reads.
 */
export interface Template {
	author?: number;
	author_text: string;
	original_source?: 'theme' | 'plugin' | 'site' | 'user';
}
