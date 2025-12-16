/**
 * WordPress dependencies
 */
import { useMemo, useState, useCallback } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { SelectControl, Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { store as noticesStore } from '@wordpress/notices';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { createTemplatePartId } from '../../template-part/edit/utils/create-template-part-id';
import useCreateOverlayTemplatePart from './use-create-overlay';

/**
 * Overlay Template Part Selector component.
 *
 * @param {Object}   props                          Component props.
 * @param {string}   props.overlay                  Currently selected overlay template part ID.
 * @param {Function} props.setAttributes            Function to update block attributes.
 * @param {Function} props.onNavigateToEntityRecord Function to navigate to template part editor.
 * @return {JSX.Element} The overlay template part selector component.
 */
export default function OverlayTemplatePartSelector( {
	overlay,
	setAttributes,
	onNavigateToEntityRecord,
} ) {
	const {
		records: templateParts,
		isResolving,
		hasResolved,
	} = useEntityRecords( 'postType', 'wp_template_part', {
		per_page: -1,
	} );

	const { createErrorNotice } = useDispatch( noticesStore );

	// Track if we're currently creating a new overlay
	const [ isCreating, setIsCreating ] = useState( false );

	// Filter template parts by overlay area
	const overlayTemplateParts = useMemo( () => {
		if ( ! templateParts ) {
			return [];
		}
		return templateParts.filter(
			( templatePart ) => templatePart.area === 'overlay'
		);
	}, [ templateParts ] );

	// Hook to create overlay template part
	const createOverlayTemplatePart =
		useCreateOverlayTemplatePart( overlayTemplateParts );

	// Build options for SelectControl
	const options = useMemo( () => {
		const baseOptions = [
			{
				label: __( 'None (default)' ),
				value: '',
			},
		];

		if ( ! hasResolved || isResolving ) {
			return baseOptions;
		}

		const templatePartOptions = overlayTemplateParts.map(
			( templatePart ) => {
				const templatePartId = createTemplatePartId(
					templatePart.theme,
					templatePart.slug
				);
				const label = templatePart.title?.rendered
					? decodeEntities( templatePart.title.rendered )
					: templatePart.slug;

				return {
					label,
					value: templatePartId,
				};
			}
		);

		return [ ...baseOptions, ...templatePartOptions ];
	}, [ overlayTemplateParts, hasResolved, isResolving ] );

	// Find the selected template part to get its title
	const selectedTemplatePart = useMemo( () => {
		if ( ! overlay || ! overlayTemplateParts ) {
			return null;
		}
		return overlayTemplateParts.find( ( templatePart ) => {
			const templatePartId = createTemplatePartId(
				templatePart.theme,
				templatePart.slug
			);
			return templatePartId === overlay;
		} );
	}, [ overlay, overlayTemplateParts ] );

	const handleSelectChange = ( value ) => {
		setAttributes( {
			overlay: value || undefined,
		} );
	};

	const handleEditClick = () => {
		if ( ! overlay || ! onNavigateToEntityRecord ) {
			return;
		}

		onNavigateToEntityRecord( {
			postId: overlay,
			postType: 'wp_template_part',
		} );
	};

	const handleCreateOverlay = useCallback( async () => {
		try {
			setIsCreating( true );

			const templatePart = await createOverlayTemplatePart();

			setAttributes( {
				overlay: templatePart.id,
			} );

			// Navigate to the new overlay for editing
			if ( onNavigateToEntityRecord ) {
				onNavigateToEntityRecord( {
					postId: templatePart.id,
					postType: 'wp_template_part',
				} );
			}
		} catch ( error ) {
			// Error handling pattern matches CreateTemplatePartModalContents.
			// See: packages/fields/src/components/create-template-part-modal/index.tsx
			// The 'unknown_error' code check ensures generic error codes don't show
			// potentially confusing technical messages, instead showing a user-friendly fallback.
			const errorMessage =
				error instanceof Error &&
				'code' in error &&
				error.message &&
				error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the overlay.' );

			createErrorNotice( errorMessage, { type: 'snackbar' } );
		} finally {
			setIsCreating( false );
		}
	}, [
		createOverlayTemplatePart,
		setAttributes,
		onNavigateToEntityRecord,
		createErrorNotice,
	] );

	const isEditButtonDisabled =
		! overlay ||
		! hasResolved ||
		! selectedTemplatePart ||
		! onNavigateToEntityRecord ||
		isResolving;

	const isCreateButtonDisabled = isResolving || isCreating;

	// Build help text
	const helpText = useMemo( () => {
		if ( overlayTemplateParts.length === 0 && hasResolved ) {
			return __( 'No overlays found.' );
		}
		return __( 'Select an overlay to use for the navigation.' );
	}, [ overlayTemplateParts.length, hasResolved ] );

	return (
		<div className="wp-block-navigation__overlay-selector">
			<Button
				size="small"
				icon={ plus }
				onClick={ handleCreateOverlay }
				disabled={ isCreateButtonDisabled }
				accessibleWhenDisabled
				isBusy={ isCreating }
				label={ __( 'Create new overlay template' ) }
				showTooltip
				className="wp-block-navigation__overlay-create-button"
			/>
			<SelectControl
				__next40pxDefaultSize
				label={ __( 'Overlay template' ) }
				value={ overlay || '' }
				options={ options }
				onChange={ handleSelectChange }
				disabled={ isResolving }
				accessibleWhenDisabled
				help={ helpText }
			/>
			{ overlay && ( ! hasResolved || selectedTemplatePart ) && (
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ handleEditClick }
					disabled={ isEditButtonDisabled }
					accessibleWhenDisabled
					aria-label={
						selectedTemplatePart
							? sprintf(
									/* translators: %s: Overlay title. */
									__( 'Edit overlay: %s' ),
									selectedTemplatePart.title?.rendered
										? decodeEntities(
												selectedTemplatePart.title
													.rendered
										  )
										: selectedTemplatePart.slug
							  )
							: __( 'Edit overlay' )
					}
					className="wp-block-navigation__overlay-edit-button"
				>
					{ __( 'Edit' ) }
				</Button>
			) }
		</div>
	);
}
