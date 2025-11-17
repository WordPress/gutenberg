/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	SelectControl,
	Button,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { pencil } from '@wordpress/icons';
import { useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

export default function OverlaySelector( { value, onChange } ) {
	const { records: templateParts } = useEntityRecords(
		'postType',
		'wp_template_part',
		{ per_page: -1 }
	);

	const onNavigateToEntityRecord = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().onNavigateToEntityRecord,
		[]
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

	const handleEditClick = () => {
		if ( value && onNavigateToEntityRecord ) {
			onNavigateToEntityRecord( {
				postId: value,
				postType: 'wp_template_part',
			} );
		}
	};

	return (
		<VStack spacing={ 1 }>
			<SelectControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Overlay Template' ) }
				value={ value || '' }
				options={ options }
				onChange={ ( newValue ) => {
					onChange( newValue === '' ? undefined : newValue );
				} }
				help={ __(
					'Select a template part to use as the custom overlay or create a new one.'
				) }
			/>
			<Button
				__next40pxDefaultSize
				variant="secondary"
				icon={ pencil }
				onClick={ handleEditClick }
				disabled={ ! value || ! onNavigateToEntityRecord }
				style={ { maxWidth: 'fit-content' } }
			>
				{ __( 'Edit Overlay' ) }
			</Button>
		</VStack>
	);
}
