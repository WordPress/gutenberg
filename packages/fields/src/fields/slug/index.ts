import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
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
	// The REST API only exposes `permalink_template` for viewable public
	// post types, so posts without a permalink hide the field.
	isVisible: ( item ) => !! item.link && !! item.permalink_template,
};

/**
 * Slug field for BasePost.
 */
export default slugField;
