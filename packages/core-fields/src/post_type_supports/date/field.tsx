import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { hasActionLink } from '../../shared/has-action-link';
import type { PostWithDate } from './types';
import DateView from './view';

/**
 * The JavaScript parts of the date field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithDate >[ string ] = {
	// Only the users who can publish the post see the control.
	isVisible: ( item ) => hasActionLink( item, 'wp:action-publish' ),
	render: DateView,
};
