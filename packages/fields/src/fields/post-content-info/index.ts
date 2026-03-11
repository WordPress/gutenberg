/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import PostContentInfoView from './post-content-info-view';

const postContentInfoField: Field< BasePost > = {
	label: __( 'Post content information' ),
	id: 'post-content-info',
	type: 'text',
	readOnly: true,
	render: PostContentInfoView,
	enableSorting: false,
	enableHiding: false,
	filterBy: false,
};

/**
 * Post content information field for BasePost.
 */
export default postContentInfoField;
