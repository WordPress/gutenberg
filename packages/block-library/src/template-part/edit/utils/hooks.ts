import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { WpTemplatePart } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';
import { serialize } from '@wordpress/blocks';
import type { Block, BlockEditProps } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { cleanForSlug } from '@wordpress/url';
import type { TemplatePartAttributes } from '../../types';
import { createTemplatePartId } from './create-template-part-id';

/**
 * Retrieves the available template parts for the given area.
 *
 * @param area       Template part area.
 * @param excludedId Template part ID to exclude.
 *
 * @return array of template parts.
 */
export function useAlternativeTemplateParts(
	area?: string,
	excludedId?: string | null
) {
	const { templateParts, isResolving } = useSelect( ( select ) => {
		const { getEntityRecords, isResolving: _isResolving } =
			select( coreStore );
		const query = { per_page: -1 };
		return {
			templateParts: getEntityRecords< WpTemplatePart >(
				'postType',
				'wp_template_part',
				query
			),
			isResolving: _isResolving( 'getEntityRecords', [
				'postType',
				'wp_template_part',
				query,
			] ),
		};
	}, [] );

	const filteredTemplateParts = useMemo( () => {
		if ( ! templateParts ) {
			return [];
		}
		return (
			templateParts.filter(
				( templatePart ) =>
					createTemplatePartId(
						templatePart.theme,
						templatePart.slug
					) !== excludedId &&
					( ! area ||
						'uncategorized' === area ||
						templatePart.area === area )
			) || []
		);
	}, [ templateParts, area, excludedId ] );

	return {
		templateParts: filteredTemplateParts,
		isResolving,
	};
}

export interface TemplatePartBlockPattern {
	name: string;
	title: string;
	blocks: Block[];
	[ key: string ]: unknown;
}

/**
 * Retrieves the available block patterns for the given area.
 *
 * @param area     Template part area.
 * @param clientId Block Client ID. (The container of the block can impact allowed blocks).
 *
 * @return array of block patterns.
 */
export function useAlternativeBlockPatterns(
	area: string | undefined,
	clientId: string
): TemplatePartBlockPattern[] {
	return useSelect(
		( select ) => {
			const blockNameWithArea = area
				? `core/template-part/${ area }`
				: 'core/template-part';
			const { getBlockRootClientId, getPatternsByBlockTypes } =
				select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			// Use rootClientId to determine which patterns can be used in the current context.
			// If revisiting the idea of template parts being spotlighted when edited, it may
			// be worth either passing null or the template part's clientId instead.
			// See the following PRs for context:
			// - https://github.com/WordPress/gutenberg/pull/73736
			// - https://github.com/WordPress/gutenberg/pull/73419
			return getPatternsByBlockTypes(
				blockNameWithArea,
				rootClientId
			) as unknown as TemplatePartBlockPattern[];
		},
		[ area, clientId ]
	);
}

export function useCreateTemplatePartFromBlocks(
	area: string | undefined,
	setAttributes: BlockEditProps< TemplatePartAttributes >[ 'setAttributes' ]
) {
	const { saveEntityRecord } = useDispatch( coreStore );

	return async (
		blocks: Block[] = [],
		title: string = __( 'Untitled Template Part' )
	) => {
		// Currently template parts only allow latin chars.
		// Fallback slug will receive suffix by default.
		const cleanSlug =
			cleanForSlug( title ).replace( /[^\w-]+/g, '' ) || 'wp-custom-part';

		// If we have `area` set from block attributes, means an exposed
		// block variation was inserted. So add this prop to the template
		// part entity on creation. Afterwards remove `area` value from
		// block attributes.
		const record = {
			title,
			slug: cleanSlug,
			content: serialize( blocks ),
			// `area` is filterable on the server and defaults to `UNCATEGORIZED`
			// if provided value is not allowed.
			area,
		};
		const templatePart = ( await saveEntityRecord(
			'postType',
			'wp_template_part',
			record
		) ) as WpTemplatePart;
		setAttributes( {
			slug: templatePart.slug,
			theme: templatePart.theme,
			area: undefined,
		} );
	};
}

/**
 * Retrieves the template part area object.
 *
 * @param area Template part area identifier.
 *
 * @return Template Part area.
 */
export function useTemplatePartArea( area?: string ) {
	return useSelect(
		( select ) => {
			const definedAreas =
				select( coreStore ).getCurrentTheme()
					?.default_template_part_areas || [];

			const selectedArea = definedAreas.find(
				( definedArea: { area: string } ) => definedArea.area === area
			);
			const defaultArea = definedAreas.find(
				( definedArea: { area: string } ) =>
					definedArea.area === 'uncategorized'
			);

			return {
				icon: selectedArea?.icon || defaultArea?.icon,
				label: selectedArea?.label || __( 'Template Part' ),
				tagName: selectedArea?.area_tag ?? 'div',
			};
		},
		[ area ]
	);
}
