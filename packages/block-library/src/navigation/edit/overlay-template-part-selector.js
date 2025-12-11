/**
 * WordPress dependencies
 */
import { useMemo, useState, useEffect } from '@wordpress/element';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { SelectControl, Spinner, Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { serialize } from '@wordpress/blocks';
import { plus } from '@wordpress/icons';
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

	// Track newly created record ID to check saving state from store
	const [ creatingRecordId, setCreatingRecordId ] = useState( null );

	// Check if the newly created record is currently saving
	const isSavingNewRecord = useSelect(
		( select ) => {
			if ( ! creatingRecordId ) {
				return false;
			}
			const { isSavingEntityRecord } = select( coreStore );
			return isSavingEntityRecord(
				'postType',
				'wp_template_part',
				creatingRecordId
			);
		},
		[ creatingRecordId ]
	);

	// Clear the creating record ID when saving completes
	useEffect( () => {
		if ( creatingRecordId && ! isSavingNewRecord ) {
			setCreatingRecordId( null );
		}
	}, [ creatingRecordId, isSavingNewRecord ] );

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

	const handleCreateOverlay = async () => {
		try {
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
					content: serialize( [] ),
					area: 'overlay',
				},
				{ throwOnError: true }
			);

			// Track the new record ID to check saving state
			setCreatingRecordId( templatePart.id );

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
			setCreatingRecordId( null );
		}
	};

	const isEditButtonDisabled =
		! overlay ||
		! parsedTemplatePart ||
		! onNavigateToEntityRecord ||
		isResolving;

	const isCreateButtonDisabled = isResolving || isSavingNewRecord;

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
				help={
					overlayTemplateParts.length === 0 && hasResolved
						? __( 'No overlays found.' )
						: __( 'Select an overlay to use for the navigation.' )
				}
			/>
			<Button
				__next40pxDefaultSize
				variant="secondary"
				onClick={ handleCreateOverlay }
				disabled={ isCreateButtonDisabled }
				accessibleWhenDisabled
				isBusy={ isSavingNewRecord }
				icon={ plus }
				className="wp-block-navigation__overlay-create-button"
			>
				{ __( 'Create new overlay' ) }
			</Button>
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
