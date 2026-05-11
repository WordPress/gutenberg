/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Template } from '../../types';
import { getItemTitle } from '../../actions/utils';
import TitleView from '../title/view';

const templateTitleField: Field< Template > = {
	type: 'text',
	label: __( 'Template' ),
	placeholder: __( 'No title' ),
	id: 'title',
	getValue: ( { item } ) => getItemTitle( item ),
	render: TitleView,
	enableHiding: false,
	enableGlobalSearch: true,
	filterBy: false,
};

/**
 * Title for the template entity.
 */
export default templateTitleField;
