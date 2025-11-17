/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { useEntityRecords } from '@wordpress/core-data';

/**
 * Component to select an overlay template part for the Navigation block.
 *
 * @param {Object} props          Component props.
 * @param {number} props.value    Current overlay template part ID.
 * @param {Function} props.onChange Callback when overlay is selected.
 * @return {JSX.Element} Overlay selector component.
 */
export default function OverlaySelector( { value, onChange } ) {
	const { records: templateParts, isResolving } = useEntityRecords(
		'postType',
		'wp_template_part',
		{
			per_page: -1,
		}
	);

	// Filter to only overlay template parts
	const overlayTemplateParts =
		templateParts?.filter( ( part ) => part.area === 'overlay' ) || [];

	const options = [
		{ label: __( 'None' ), value: '' },
		...overlayTemplateParts.map( ( part ) => ( {
			label: part.title?.rendered || part.slug || __( 'Untitled' ),
			value: part.id,
		} ) ),
	];

	if ( isResolving ) {
		return null;
	}

	return (
		<SelectControl
			__nextHasNoMarginBottom
			label={ __( 'Overlay Template Part' ) }
			value={ value || '' }
			options={ options }
			onChange={ ( newValue ) => {
				onChange( newValue ? parseInt( newValue, 10 ) : undefined );
			} }
			help={ __(
				'Select a custom overlay template part for this navigation menu.'
			) }
		/>
	);
}
