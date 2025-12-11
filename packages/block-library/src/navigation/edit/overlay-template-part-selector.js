/**
 * WordPress dependencies
 */
import {
	useMemo,
	useState,
	useCallback,
	createInterpolateElement,
} from '@wordpress/element';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { SelectControl, Spinner, Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { createTemplatePartId } from '../../template-part/edit/utils/create-template-part-id';
import {
	parseTemplatePartId,
	getUniqueTemplatePartTitle,
	getCleanTemplatePartSlug,
} from './utils';

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

	const { saveEntityRecord, invalidateResolution } = useDispatch( coreStore );
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

	// Parse selected template part for navigation
	const parsedTemplatePart = useMemo( () => {
		return parseTemplatePartId( overlay );
	}, [ overlay ] );

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

			// Generate unique name using only overlay area template parts
			// Filter to only include template parts with titles for uniqueness check
			const templatePartsWithTitles = overlayTemplateParts.filter(
				( templatePart ) => templatePart.title?.rendered
			);
			const uniqueTitle = getUniqueTemplatePartTitle(
				__( 'Overlay' ),
				templatePartsWithTitles
			);
			const cleanSlug = getCleanTemplatePartSlug( uniqueTitle );

			// Create the template part
			const templatePart = await saveEntityRecord(
				'postType',
				'wp_template_part',
				{
					slug: cleanSlug,
					title: uniqueTitle,
					area: 'overlay',
				},
				{ throwOnError: true }
			);

			// Invalidate the template parts resolution cache to refresh the list
			invalidateResolution( 'getEntityRecords', [
				'postType',
				'wp_template_part',
				{ per_page: -1 },
			] );

			// Set the newly created overlay as selected
			const templatePartId = createTemplatePartId(
				templatePart.theme,
				templatePart.slug
			);
			setAttributes( {
				overlay: templatePartId,
			} );

			// Optionally navigate to the new overlay for editing
			if ( onNavigateToEntityRecord ) {
				onNavigateToEntityRecord( {
					postId: templatePartId,
					postType: 'wp_template_part',
				} );
			}
		} catch ( error ) {
			const errorMessage =
				error instanceof Error &&
				'code' in error &&
				error.message &&
				error.code !== 'unknown_error'
					? error.message
					: __(
							'An error occurred while creating the overlay template part.'
					  );

			createErrorNotice( errorMessage, { type: 'snackbar' } );
		} finally {
			setIsCreating( false );
		}
	}, [
		overlayTemplateParts,
		saveEntityRecord,
		setAttributes,
		onNavigateToEntityRecord,
		invalidateResolution,
		createErrorNotice,
	] );

	const isEditButtonDisabled =
		! overlay ||
		! parsedTemplatePart ||
		! onNavigateToEntityRecord ||
		isResolving;

	const isCreateButtonDisabled = isResolving || isCreating;

	// Build help text with create button using createInterpolateElement
	// Must be called before early return to follow Rules of Hooks
	const helpText = useMemo( () => {
		const createButton = (
			<Button
				__next40pxDefaultSize
				variant="link"
				onClick={ handleCreateOverlay }
				disabled={ isCreateButtonDisabled }
				accessibleWhenDisabled
				isBusy={ isCreating }
				className="wp-block-navigation__overlay-create-link"
			>
				{ __( 'Create new?' ) }
			</Button>
		);

		if ( overlayTemplateParts.length === 0 && hasResolved ) {
			return createInterpolateElement(
				__( 'No overlays found. <button />' ),
				{
					button: createButton,
				}
			);
		}
		return createInterpolateElement(
			__( 'Select an overlay to use for the navigation. <button />' ),
			{
				button: createButton,
			}
		);
	}, [
		overlayTemplateParts.length,
		hasResolved,
		isCreateButtonDisabled,
		isCreating,
		handleCreateOverlay,
	] );

	if ( isResolving && ! hasResolved ) {
		return (
			<div className="wp-block-navigation__overlay-selector">
				<Spinner />
				<p>{ __( 'Loading overlays…' ) }</p>
			</div>
		);
	}

	return (
		<div className="wp-block-navigation__overlay-selector">
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Overlay template' ) }
				value={ overlay || '' }
				options={ options }
				onChange={ handleSelectChange }
				disabled={ isResolving }
				accessibleWhenDisabled
				help={ helpText }
			/>
			{ overlay && (
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
