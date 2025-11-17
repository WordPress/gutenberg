/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { useEntityRecords } from '@wordpress/core-data';

export default function OverlaySelector( { value, onChange } ) {
	const { records: templateParts } = useEntityRecords(
		'postType',
		'wp_template_part',
		{ per_page: -1 }
	);

	const overlayParts =
		templateParts?.filter( ( part ) => part.area === 'overlay' ) || [];

	const options = [
		{ label: __( 'None' ), value: '' },
		...overlayParts.map( ( part ) => ( {
			label: part.title?.rendered || part.slug || __( 'Untitled' ),
			value: part.id,
		} ) ),
	];

	return (
		<SelectControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ __( 'Overlay Template Part' ) }
			value={ value || '' }
			options={ options }
			onChange={ ( newValue ) => {
				onChange( newValue === '' ? undefined : newValue );
			} }
		/>
	);
}
