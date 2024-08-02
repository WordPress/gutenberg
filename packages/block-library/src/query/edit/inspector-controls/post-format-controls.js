/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

export default function PostFormatControls( { onChange, query } ) {
	const { postType, postFormat } = query;

	const { postFormats } = useSelect(
		( select ) => {
			const { getEntityRecords } = select( coreStore );
			return {
				postFormats: getEntityRecords( 'taxonomy', 'post_format', {
					order: 'asc',
					_fields: 'id,name',
					context: 'view',
					per_page: -1,
					post_type: postType,
				} ),
			};
		},
		[ postType ]
	);

	const postFormatOptions = postFormats
		? [
				{ value: '', label: __( 'All' ) },
				...postFormats.map( ( { id, name } ) => ( {
					value: id,
					label: decodeEntities( name ),
				} ) ),
		  ]
		: [ { value: '', label: __( 'All' ) } ];

	return (
		<SelectControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ __( 'Formats' ) }
			value={ postFormat }
			options={ postFormatOptions }
			onChange={ ( value ) => {
				onChange( { postFormat: value } );
			} }
		/>
	);
}
