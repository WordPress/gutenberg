/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { Template } from '../../types';

const descriptionField: Field< Template > = {
	id: 'description',
	type: 'text',
	label: __( 'Description' ),
	placeholder: __( 'Add a description' ),
	getValue: ( { item } ) => {
		return decodeEntities( item.description || '' );
	},
	render: ( { item } ) => {
		const { description } = item;
		return description && <Text>{ decodeEntities( description ) }</Text>;
	},
	Edit: {
		control: 'textarea',
		rows: 4,
	},
	isVisible: ( item ) => {
		const isCustomRecord =
			item.source === 'custom' && ! item.has_theme_file && item.is_custom;
		if ( isCustomRecord ) {
			return true;
		}
		return !! item.description;
	},
	enableSorting: false,
	filterBy: false,
	enableGlobalSearch: true,
};

/**
 * Description field for templates.
 */
export default descriptionField;
