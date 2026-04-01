/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { __experimentalText as Text } from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { Template, TemplatePart, Pattern } from '../../types';

type DescriptionPost = Template | TemplatePart | Pattern;

const descriptionField: Field< DescriptionPost > = {
	id: 'description',
	type: 'text',
	label: __( 'Description' ),
	placeholder: __( 'Add a description' ),
	getValue: ( { item } ) => {
		if ( item.type === 'wp_block' ) {
			const excerpt = ( item as Pattern ).excerpt;
			if ( typeof excerpt === 'string' ) {
				return decodeEntities( excerpt );
			}
			return decodeEntities( excerpt?.raw || '' );
		}
		return decodeEntities(
			( item as Template | TemplatePart ).description || ''
		);
	},
	render: ( { item } ) => {
		let description;
		if ( item.type === 'wp_block' ) {
			const excerpt = ( item as Pattern ).excerpt;
			if ( typeof excerpt === 'string' ) {
				description = excerpt;
			} else {
				description = excerpt?.raw;
			}
		} else {
			description = ( item as Template | TemplatePart ).description;
		}
		// TODO: we need to truncate only for patterns or custom templates..
		return (
			description && (
				<Text
					className="fields-controls__description"
					align="left"
					numberOfLines={ 4 }
					truncate={ false }
				>
					{ decodeEntities( description ) }
				</Text>
			)
		);
	},
	Edit: {
		control: 'textarea',
		rows: 4,
	},
	isVisible: ( item ) => {
		if ( item.type === 'wp_block' ) {
			return true;
		}
		item = item as Template | TemplatePart;
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
 * Description field for design post types (templates, template parts, and patterns).
 */
export default descriptionField;
