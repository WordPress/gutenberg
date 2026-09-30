import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { hasActionLink } from '../../shared/has-action-link';
import PasswordEdit from './edit';
import type { PostWithPassword } from './types';

/**
 * The JavaScript parts of the password field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithPassword >[ string ] =
	{
		Edit: PasswordEdit,
		// Private posts cannot have a password, and only the users who can
		// publish the post see the control.
		isVisible: ( item ) =>
			item.status !== 'private' &&
			hasActionLink( item, 'wp:action-publish' ),
	};
