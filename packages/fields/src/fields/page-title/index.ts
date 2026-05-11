/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import { getItemTitle } from '../../actions/utils';
import PageTitleView from './view';

const pageTitleField: Field< BasePost > = {
	type: 'text',
	id: 'title',
	label: __( 'Title' ),
	placeholder: __( 'No title' ),
	getValue: ( { item } ) => getItemTitle( item ),
	render: PageTitleView,
	enableHiding: false,
	enableGlobalSearch: true,
	filterBy: false,
};

/**
 * Title for the page entity.
 */
export default pageTitleField;
