/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Pattern } from '../../types';
import { getItemTitle } from '../../actions/utils';
import PatternTitleView from './view';

const patternTitleField: Field< Pattern > = {
	type: 'text',
	id: 'title',
	label: __( 'Title' ),
	placeholder: __( 'No title' ),
	getValue: ( { item } ) => getItemTitle( item ),
	render: PatternTitleView,
	enableHiding: false,
	enableGlobalSearch: true,
	filterBy: false,
};

/**
 * Title for the pattern entity.
 */
export default patternTitleField;
