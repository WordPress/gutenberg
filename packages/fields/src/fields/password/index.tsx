import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import type { BasePost } from '../../types';
import { hasActionLink } from '../utils';
import PasswordEdit from './edit';

const passwordField: Field< BasePost > = {
	id: 'password',
	type: 'text',
	label: __( 'Password' ),
	Edit: PasswordEdit,
	enableSorting: false,
	enableHiding: false,
	isVisible: ( item ) =>
		item.status !== 'private' && hasActionLink( item, 'wp:action-publish' ),
	filterBy: false,
};

/**
 * Password field for BasePost.
 */
export default passwordField;
