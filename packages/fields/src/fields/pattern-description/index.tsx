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
import type { Pattern } from '../../types';

function getPatternDescription( item: Pattern ) {
	if ( typeof item.excerpt === 'string' ) {
		return decodeEntities( item.excerpt );
	}
	return decodeEntities( item.excerpt?.raw || '' );
}

const patternDescriptionField: Field< Pattern > = {
	id: 'excerpt',
	type: 'text',
	label: __( 'Description' ),
	placeholder: __( 'Add a description' ),
	getValue: ( { item } ) => getPatternDescription( item ),
	render: ( { item } ) => {
		const description = getPatternDescription( item );
		return description ? <Text>{ description }</Text> : null;
	},
	Edit: {
		control: 'textarea',
		rows: 4,
	},
	enableSorting: false,
	enableHiding: false,
	filterBy: false,
	enableGlobalSearch: true,
};

/**
 * Description field for patterns.
 */
export default patternDescriptionField;
