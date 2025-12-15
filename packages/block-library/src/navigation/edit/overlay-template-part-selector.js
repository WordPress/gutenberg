/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { SelectControl, Spinner, Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { createTemplatePartId } from '../../template-part/edit/utils/create-template-part-id';

/**
 * Parses a template part ID into theme and slug components.
 *
 * @param {string} templatePartId Template part ID in format "theme//slug".
 * @return {{theme: string, slug: string}|null} Parsed components or null if invalid.
 */
function parseTemplatePartId( templatePartId ) {
	if ( ! templatePartId || typeof templatePartId !== 'string' ) {
		return null;
	}

	const parts = templatePartId.split( '//' );
	if ( parts.length !== 2 ) {
		return null;
	}

	return {
		theme: parts[ 0 ],
		slug: parts[ 1 ],
	};
}

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

	const isEditButtonDisabled =
		! overlay ||
		! parsedTemplatePart ||
		! onNavigateToEntityRecord ||
		isResolving;

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
