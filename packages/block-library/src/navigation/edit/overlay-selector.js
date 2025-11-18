/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	SelectControl,
	Button,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { pencil } from '@wordpress/icons';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { serialize } from '@wordpress/blocks';
import { paramCase as kebabCase } from 'change-case';

/**
 * Internal dependencies
 */
import { createTemplatePartId } from '../../template-part/edit/utils/create-template-part-id';

export default function OverlaySelector( { value, onChange } ) {
	const [ isCreating, setIsCreating ] = useState( false );

	const { records: templateParts } = useEntityRecords(
		'postType',
		'wp_template_part',
		{ per_page: -1 }
	);

	const { saveEntityRecord } = useDispatch( coreStore );

	const onNavigateToEntityRecord = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().onNavigateToEntityRecord,
		[]
	);

	const overlayParts =
		templateParts?.filter( ( part ) => part.area === 'overlay' ) || [];

	const options = [
		{ label: __( 'None' ), value: '' },
		...overlayParts.map( ( part ) => {
			const templatePartId = createTemplatePartId(
				part.theme,
				part.slug
			);
			return {
				label: part.title?.rendered || part.slug || __( 'Untitled' ),
				value: templatePartId,
			};
		} ),
	];

	const handleEditClick = () => {
		if ( value && onNavigateToEntityRecord ) {
			onNavigateToEntityRecord( {
				postId: value,
				postType: 'wp_template_part',
			} );
		}
	};

	const handleCreateNew = async () => {
		setIsCreating( true );

		// Generate a unique title by checking existing overlay template parts
		const baseTitle = __( 'Overlay' );
		const existingTitles = overlayParts.map(
			( part ) => part.title?.rendered || ''
		);

		// Find the next available number
		let titleNumber = 1;
		let uniqueTitle = baseTitle;
		while ( existingTitles.includes( uniqueTitle ) ) {
			titleNumber++;
			uniqueTitle = `${ baseTitle } ${ titleNumber }`;
		}

		const cleanSlug =
			kebabCase( uniqueTitle ).replace( /[^\w-]+/g, '' ) ||
			'wp-custom-overlay';

		try {
			const templatePart = await saveEntityRecord(
				'postType',
				'wp_template_part',
				{
					title: uniqueTitle,
					slug: cleanSlug,
					content: serialize( [] ),
					area: 'overlay',
				},
				{ throwOnError: true }
			);

			// Create the proper template part ID format (theme//slug)
			const templatePartId = createTemplatePartId(
				templatePart.theme,
				templatePart.slug
			);

			// Set the new template part as the selected overlay
			onChange( templatePartId );

			// Navigate to the new template part for editing
			if ( onNavigateToEntityRecord && templatePartId ) {
				onNavigateToEntityRecord( {
					postId: templatePartId,
					postType: 'wp_template_part',
				} );
			}
		} catch ( error ) {
			console.error( 'Failed to create overlay template part:', error );
		} finally {
			setIsCreating( false );
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
				disabled={ isCreating }
				help={
					<>
						{ __(
							'Select a template part to use as the custom overlay or '
						) }
						<button
							type="button"
							onClick={ handleCreateNew }
							disabled={ isCreating }
							style={ {
								background: 'none',
								border: 'none',
								color: isCreating
									? 'var(--wp-components-color-foreground)'
									: 'var(--wp-admin-theme-color)',
								cursor: isCreating ? 'not-allowed' : 'pointer',
								textDecoration: 'underline',
								padding: 0,
								font: 'inherit',
								opacity: isCreating ? 0.5 : 1,
							} }
						>
							{ __( 'create a new one' ) }
						</button>
						.
					</>
				}
			/>
			<Button
				__next40pxDefaultSize
				variant="secondary"
				icon={ pencil }
				onClick={ handleEditClick }
				disabled={ ! value || ! onNavigateToEntityRecord || isCreating }
				style={ { maxWidth: 'fit-content' } }
			>
				{ __( 'Edit Overlay' ) }
			</Button>
		</VStack>
	);
}
