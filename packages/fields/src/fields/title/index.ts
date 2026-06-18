/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { CommonPost } from '../../types';
import { getItemTitle } from '../../actions/utils';
import TitleView from './view';

const titleField: Field< CommonPost > = {
	type: 'text',
	id: 'title',
	label: __( 'Title' ),
	placeholder: __( 'No title' ),
	getValue: ( { item } ) => getItemTitle( item ),
	render: TitleView,
	enableHiding: true,
	enableGlobalSearch: true,
	filterBy: false,
};

/**
 * Title for the any entity with a `title` property.
 * For patterns, pages or templates you should use the respective field
 * because there are some differences in the rendering, labels, etc.
 */
export default titleField;
