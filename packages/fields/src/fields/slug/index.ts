/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import SlugEdit from './slug-edit';
import SlugView from './slug-view';

const slugField: Field< BasePost > = {
	id: 'slug',
	type: 'text',
	label: __( 'Slug' ),
	Edit: SlugEdit,
	render: SlugView,
	filterBy: false,
};

/**
 * Slug field for BasePost.
 */
export default slugField;
