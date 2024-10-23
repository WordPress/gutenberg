/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import { __ } from '@wordpress/i18n';
import SlugEdit from './slug-edit';
import SlugView from './slug-view';

const slugField: Field< BasePost > = {
	id: 'slug',
	type: 'text',
	label: __( 'Slug' ),
	getValue: ( { item } ) => item.slug,
	Edit: SlugEdit,
	render: SlugView,
};

/**
 * The slugField is a field that allows the user to edit the slug of a postType.
 */
export default slugField;
