import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import type { BasePost } from '../../types';
import { hasActionLink } from '../utils';

const stickyField: Field< BasePost > = {
	id: 'sticky',
	type: 'boolean',
	label: __( 'Sticky' ),
	description: __( 'Pin this post to the top of the blog.' ),
	enableSorting: false,
	enableHiding: false,
	isVisible: ( item ) => hasActionLink( item, 'wp:action-sticky' ),
	filterBy: false,
};

/**
 * Sticky field for BasePost.
 */
export default stickyField;
