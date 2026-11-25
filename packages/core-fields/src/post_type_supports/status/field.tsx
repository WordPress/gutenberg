import { isInTheFuture } from '@wordpress/date';
import type { FieldsScriptParts } from '../../types';
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
	setValue: ( { item, value } ) => {
		const edits: Partial< PostWithStatus > = { status: value };
		// A post that is no longer scheduled drops its date in the future,
		// so it publishes when it is published, not at that date.
		if (
			item.status === 'future' &&
			value !== 'future' &&
			item.date &&
			isInTheFuture( item.date )
		) {
			edits.date = null;
		}
		// A private post can't have a password.
		if ( value === 'private' && item.password ) {
			edits.password = '';
		}
		return edits;
	},
	render: StatusView,
	// A user who can't publish can't change the status either.
	isDisabled: ( { item } ) => ! hasActionLink( item, 'wp:action-publish' ),
};
