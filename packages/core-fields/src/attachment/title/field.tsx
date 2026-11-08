import { __ } from '@wordpress/i18n';
import type { FieldsScriptParts } from '../../types';
import { getRawContent } from '../get-raw-content';
import TitleView from '../../shared/title/view';
import type { MediaItem } from '../types';

/**
 * The JavaScript parts of the title field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< MediaItem >[ string ] = {
	getValue: ( { item } ) => getRawContent( item.title ),
	isValid: {
		required: true,
		custom: ( item ) =>
			getRawContent( item.title ).trim()
				? null
				: __( 'Enter a title with at least one non-space character.' ),
	},
	render: TitleView,
};
