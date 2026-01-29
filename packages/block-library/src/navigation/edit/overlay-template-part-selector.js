/**
 * WordPress dependencies
 */
import { useMemo, useState, useCallback } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	SelectControl,
	Button,
	FlexBlock,
	FlexItem,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { store as noticesStore } from '@wordpress/notices';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { createTemplatePartId } from '../../template-part/edit/utils/create-template-part-id';
import useCreateOverlayTemplatePart from './use-create-overlay';
import DeletedOverlayWarning from './deleted-overlay-warning';
import { NAVIGATION_OVERLAY_TEMPLATE_PART_AREA } from '../constants';

/**
 * Overlay Template Part Selector component.
 *
 * @param {Object}   props                          Component props.
 * @param {string}   props.overlay                  Currently selected overlay template part ID.
 * @param {Function} props.setAttributes            Function to update block attributes.
 * @param {Function} props.onNavigateToEntityRecord Function to navigate to template part editor.
 * @param {boolean}  props.isCreatingOverlay        Whether an overlay is being created (lifted state).
 * @param {Function} props.setIsCreatingOverlay     Function to set creating overlay state (lifted state).
 * @return {JSX.Element} The overlay template part selector component.
 */
export default function OverlayTemplatePartSelector( {
	overlay,
	setAttributes,
	onNavigateToEntityRecord,
	isCreatingOverlay,
	setIsCreatingOverlay,
} ) {
	const headingId = useInstanceId(
		OverlayTemplatePartSelector,
		'wp-block-navigation__overlay-selector-heading'
	);

	const {
		records: templateParts,
		isResolving,
		hasResolved,
	} = useEntityRecords( 'postType', 'wp_template_part', {
		per_page: -1,
	} );

	const { createErrorNotice } = useDispatch( noticesStore );

	const currentTheme = useSelect(
		( select ) => select( coreStore ).getCurrentTheme()?.stylesheet,
		[]
	);

	// Check state for creating status if provided, otherwise use local state
	const [ localIsCreating, setLocalIsCreating ] = useState( false );
	const isCreating =
		isCreatingOverlay !== undefined ? isCreatingOverlay : localIsCreating;
	const setIsCreating =
		setIsCreatingOverlay !== undefined
			? setIsCreatingOverlay
			: setLocalIsCreating;

	// Filter template parts by overlay area
	const overlayTemplateParts = useMemo( () => {
		if ( ! templateParts ) {
			return [];
		}
		return templateParts.filter(
			( templatePart ) =>
				templatePart.area === NAVIGATION_OVERLAY_TEMPLATE_PART_AREA
		);
	}, [ templateParts ] );

	// Hook to create overlay template part
	const createOverlayTemplatePart =
		useCreateOverlayTemplatePart( overlayTemplateParts );

	// Find the selected template part to get its title
	const selectedTemplatePart = useMemo( () => {
		if ( ! overlay || ! overlayTemplateParts ) {
			return null;
		}
		return overlayTemplateParts.find(
			( templatePart ) => templatePart.slug === overlay
		);
	}, [ overlay, overlayTemplateParts ] );

	// Build options for SelectControl
	const options = useMemo( () => {
		const baseOptions = [
			{
				label: __( 'Default' ),
				value: '',
			},
		];

		if ( ! hasResolved || isResolving ) {
			return baseOptions;
		}

		const templatePartOptions = overlayTemplateParts.map(
			( templatePart ) => {
				const label = templatePart.title?.rendered
					? decodeEntities( templatePart.title.rendered )
					: templatePart.slug;

				return {
					label,
					value: templatePart.slug,
				};
			}
		);

		// If an overlay is selected but not found in the list, add it as a "missing" option
		if ( overlay && ! selectedTemplatePart ) {
			templatePartOptions.unshift( {
				label: sprintf(
					/* translators: %s: Overlay slug. */
					__( '%s (missing)' ),
					overlay
				),
				value: overlay,
			} );
		}

		return [ ...baseOptions, ...templatePartOptions ];
	}, [
		overlayTemplateParts,
		hasResolved,
		isResolving,
		overlay,
		selectedTemplatePart,
	] );

	const handleSelectChange = ( value ) => {
		setAttributes( {
			overlay: value || undefined,
		} );
	};

	const handleEditClick = () => {
		if (
			! overlay ||
			! selectedTemplatePart ||
			! onNavigateToEntityRecord
		) {
			return;
		}

		// Resolve the full template part ID using theme
		// Default to current theme if not set
		const theme = selectedTemplatePart.theme || currentTheme;
		const templatePartId = createTemplatePartId( theme, overlay );

		onNavigateToEntityRecord( {
			postId: templatePartId,
			postType: 'wp_template_part',
		} );
	};

	const handleCreateOverlay = useCallback( async () => {
		try {
			setIsCreating( true );

			const templatePart = await createOverlayTemplatePart();

			setAttributes( {
				overlay: templatePart.slug,
			} );

			// Navigate to the new overlay for editing
			// Create the full ID using theme and slug
			if ( onNavigateToEntityRecord ) {
				const theme = templatePart.theme || currentTheme;
				const templatePartId = createTemplatePartId(
					theme,
					templatePart.slug
				);
				onNavigateToEntityRecord( {
					postId: templatePartId,
					postType: 'wp_template_part',
				} );
			} else {
				setIsCreating( false );
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
			setIsCreating( false );
		}
	}, [
		createOverlayTemplatePart,
		setAttributes,
		onNavigateToEntityRecord,
		createErrorNotice,
		currentTheme,
		setIsCreating,
	] );

	const handleClearOverlay = useCallback( () => {
		setAttributes( { overlay: undefined } );
	}, [ setAttributes ] );

	const isCreateButtonDisabled = isResolving || isCreating;

	// Check if the selected overlay is missing (deleted)
	const isOverlayMissing = useMemo( () => {
		return (
			overlay && hasResolved && ! isResolving && ! selectedTemplatePart
		);
	}, [ overlay, hasResolved, isResolving, selectedTemplatePart ] );

	// Build help text
	const helpText = useMemo( () => {
		if ( overlayTemplateParts.length === 0 && hasResolved ) {
			return __( 'No overlays found.' );
		}
		return __( 'Select an overlay for navigation.' );
	}, [ overlayTemplateParts.length, hasResolved ] );

	// Tooltip/aria-label text for the edit button
	const editButtonLabel = useMemo( () => {
		return selectedTemplatePart
			? sprintf(
					/* translators: %s: Overlay title. */
					__( 'Edit overlay: %s' ),
					selectedTemplatePart.title?.rendered
						? decodeEntities( selectedTemplatePart.title.rendered )
						: selectedTemplatePart.slug
			  )
			: __( 'Edit overlay' );
	}, [ selectedTemplatePart ] );

	return (
		<div className="wp-block-navigation__overlay-selector">
			<h3
				id={ headingId }
				className="wp-block-navigation__overlay-selector-header"
			>
				{ __( 'Overlay template' ) }
			</h3>
			{ hasResolved &&
			( overlayTemplateParts.length === 0 ||
				( isCreating && overlayTemplateParts.length === 1 ) ) ? (
				<>
					<Button
						__next40pxDefaultSize
						variant="secondary"
						onClick={ handleCreateOverlay }
						disabled={ isCreateButtonDisabled }
						accessibleWhenDisabled
						isBusy={ isCreating }
						className="wp-block-navigation__overlay-create-button-prominent"
					>
						{ __( 'Create overlay' ) }
					</Button>
				</>
			) : (
				<>
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
					<HStack
						alignment="flex-start"
						className="wp-block-navigation__overlay-selector-controls"
					>
						<FlexBlock>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Overlay template' ) }
								hideLabelFromVision
								aria-labelledby={ headingId }
								value={ overlay || '' }
								options={ options }
								onChange={ handleSelectChange }
								disabled={ isResolving }
								accessibleWhenDisabled
								help={ helpText }
							/>
						</FlexBlock>
						{ overlay && hasResolved && selectedTemplatePart && (
							<FlexItem>
								<Button
									__next40pxDefaultSize
									variant="secondary"
									onClick={ handleEditClick }
									disabled={ ! onNavigateToEntityRecord }
									accessibleWhenDisabled
									label={ editButtonLabel }
									showTooltip
									className="wp-block-navigation__overlay-edit-button"
								>
									{ __( 'Edit' ) }
								</Button>
							</FlexItem>
						) }
					</HStack>
					{ isOverlayMissing && (
						<DeletedOverlayWarning
							onClear={ handleClearOverlay }
							onCreate={ handleCreateOverlay }
							isCreating={ isCreating }
						/>
					) }
				</>
			) }
			<HStack
				alignment="flex-start"
				className="wp-block-navigation__overlay-help-text-wrapper"
			>
				<Text
					variant="muted"
					isBlock
					className="wp-block-navigation__overlay-help-text"
				>
					{ __(
						'An overlay template allows you to customize the appearance of the dialog that opens when the menu button is pressed.'
					) }
				</Text>
			</HStack>
		</div>
	);
}
