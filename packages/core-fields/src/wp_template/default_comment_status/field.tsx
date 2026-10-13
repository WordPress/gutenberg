import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { __ } from '@wordpress/i18n';

interface SiteSettings {
	default_comment_status?: string | null;
}

/**
 * The JavaScript parts of the discussion field; the editor summary form maps
 * it to the `root/site` entity.
 */
export const fieldExtensions: FieldsScriptParts< SiteSettings >[ string ] = {
	getValue: ( { item } ) => item.default_comment_status || '',
	setValue: ( { value } ) => ( {
		default_comment_status: value || null,
	} ),
	render: ( { item } ) =>
		item.default_comment_status === 'open'
			? __( 'Comments open' )
			: __( 'Comments closed' ),
};
