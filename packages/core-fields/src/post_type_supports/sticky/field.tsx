import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { hasActionLink } from '../../shared/has-action-link';
import type { ItemWithLinks } from '../../shared/has-action-link';

/**
 * The JavaScript part of the sticky field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< ItemWithLinks >[ string ] = {
	// Only the users who can make the post sticky see the control.
	isVisible: ( item ) => hasActionLink( item, 'wp:action-sticky' ),
};
