/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { createTemplatePartId } from './create-template-part-id';

/**
 * Retrieves the available template parts for the given area.
 *
 * @param {string} area       Template part area.
 * @param {string} excludedId Template part ID to exclude.
 *
 * @return {{ templateParts: Array, isResolving: boolean }} array of template parts.
 */
export function useAlternativeTemplateParts( area, excludedId ) {
	const { templateParts, isResolving } = useSelect( ( select ) => {
		const { getEntityRecords, isResolving: _isResolving } = select(
			coreStore
		);
		const query = { per_page: -1 };
		return {
			templateParts: getEntityRecords(
				'postType',
				'wp_template_part',
				query
			),
			isLoading: _isResolving( 'getEntityRecords', [
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
	}, [ templateParts, area ] );

	return {
		templateParts: filteredTemplateParts,
		isResolving,
	};
}

/**
 * Retrieves the available block patterns for the given area.
 *
 * @param {string} area     Template part area.
 * @param {string} clientId Block Client ID. (The container of the block can impact allowed blocks).
 *
 * @return {Array} array of block patterns.
 */
export function useAlternativeBlockPatterns( area, clientId ) {
	return useSelect(
		( select ) => {
			const blockNameWithArea = area
				? `core/template-part/${ area }`
				: 'core/template-part';
			const {
				getBlockRootClientId,
				__experimentalGetPatternsByBlockTypes,
			} = select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			return __experimentalGetPatternsByBlockTypes(
				blockNameWithArea,
				rootClientId
			);
		},
		[ area, clientId ]
	);
}
