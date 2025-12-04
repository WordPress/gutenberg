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
 * @param {string}   props.overlayTemplatePart       Currently selected overlay template part ID.
 * @param {Function} props.setAttributes             Function to update block attributes.
 * @param {Function} props.onNavigateToEntityRecord  Function to navigate to template part editor.
 * @return {JSX.Element} The overlay template part selector component.
 */
export default function OverlayTemplatePartSelector( {
	overlayTemplatePart,
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
				label: __( 'None' ),
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
		return parseTemplatePartId( overlayTemplatePart );
	}, [ overlayTemplatePart ] );

	const handleSelectChange = ( value ) => {
		setAttributes( {
			overlayTemplatePart: value || undefined,
		} );
	};

	const handleEditClick = () => {
		if ( ! parsedTemplatePart || ! onNavigateToEntityRecord ) {
			return;
		}

		onNavigateToEntityRecord( {
			kind: 'postType',
			name: 'wp_template_part',
			postId: overlayTemplatePart,
		} );
	};

	const isEditButtonDisabled =
		! overlayTemplatePart ||
		! parsedTemplatePart ||
		! onNavigateToEntityRecord ||
		isResolving;

	if ( isResolving && ! hasResolved ) {
		return (
			<div>
				<Spinner />
				<p>{ __( 'Loading overlays…' ) }</p>
			</div>
		);
	}

	return (
		<div className="wp-block-navigation__overlay-template-part-selector">
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Overlay' ) }
				value={ overlayTemplatePart || '' }
				options={ options }
				onChange={ handleSelectChange }
				disabled={ isResolving }
				accessibleWhenDisabled
				help={
					overlayTemplateParts.length === 0 && hasResolved
						? __(
								'No overlays available. Create one in the Site Editor.'
						  )
						: __( 'Select an overlay to use for the navigation.' )
				}
			/>
			<Button
				__next40pxDefaultSize
				variant="secondary"
				onClick={ handleEditClick }
				disabled={ isEditButtonDisabled }
				accessibleWhenDisabled
				aria-label={
					parsedTemplatePart
						? sprintf(
								/* translators: %s: Overlay title or slug. */
								__( 'Edit overlay: %s' ),
								overlayTemplatePart
						  )
						: __( 'Edit overlay' )
				}
				style={ { marginTop: '8px', width: '100%' } }
			>
				{ __( 'Edit' ) }
			</Button>
		</div>
	);
}
