import type { FieldsScriptParts } from '@wordpress/fields-loader';

interface SiteSettings {
	posts_per_page?: number;
}

/**
 * The JavaScript parts of the posts per page field; the editor summary form
 * maps it to the `root/site` entity.
 */
export const fieldExtensions: FieldsScriptParts< SiteSettings >[ string ] = {
	getValue: ( { item } ) => item.posts_per_page ?? 1,
	setValue: ( { value } ) => ( { posts_per_page: value } ),
};
