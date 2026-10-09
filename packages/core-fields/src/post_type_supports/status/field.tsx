import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { hasActionLink } from '../../shared/has-action-link';
import type { PostWithStatus } from './types';
import StatusView from './view';

/**
 * The JavaScript parts of the status field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithStatus >[ string ] = {
	// An auto-draft is a draft that hasn't been saved yet, so treat it as
	// one for display, selection, and filtering.
	getValue: ( { item } ) =>
		item.status === 'auto-draft' ? 'draft' : item.status,
	render: StatusView,
	// A user who can't publish can't change the status either.
	isDisabled: ( { item } ) => ! hasActionLink( item, 'wp:action-publish' ),
};
