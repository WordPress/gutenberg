/**
 * WordPress dependencies
 */
import { shuffle } from '@wordpress/icons';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

const EMPTY_ARRAY = [];

export default function Shuffle( { clientId } ) {
	const { categories, patterns } = useSelect(
		( select ) => {
			const {
				getBlockAttributes,
				getBlockRootClientId,
				__experimentalGetAllowedPatterns,
			} = select( blockEditorStore );
			const attributes = getBlockAttributes( clientId );
			const _categories = attributes?.metadata?.categories || EMPTY_ARRAY;
			const rootBlock = getBlockRootClientId( clientId );
			const _patterns = __experimentalGetAllowedPatterns( rootBlock );
			return {
				categories: _categories,
				patterns: _patterns,
			};
		},
		[ clientId ]
	);
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const sameCategoryPatternsWithSingleWrapper = useMemo( () => {
		if (
			! categories ||
			categories.length === 0 ||
			! patterns ||
			patterns.length === 0
		) {
			return EMPTY_ARRAY;
		}
		return patterns.filter( ( pattern ) => {
			return (
				// Check if the pattern has only one top level block,
				// otherwise we may shuffle to pattern that will not allow to continue shuffling.
				pattern.blocks.length === 1 &&
				pattern.categories.some( ( category ) => {
					return categories.includes( category );
				} )
			);
		} );
	}, [ categories, patterns ] );
	if ( sameCategoryPatternsWithSingleWrapper.length === 0 ) {
		return null;
	}
	return (
		<ToolbarGroup>
			<ToolbarButton
				label={ __( 'Shuffle' ) }
				icon={ shuffle }
				onClick={ () => {
					const randomPattern =
						sameCategoryPatternsWithSingleWrapper[
							Math.floor(
								// eslint-disable-next-line no-restricted-syntax
								Math.random() *
									sameCategoryPatternsWithSingleWrapper.length
							)
						];
					randomPattern.blocks[ 0 ].attributes = {
						...randomPattern.blocks[ 0 ].attributes,
						metadata: {
							...randomPattern.blocks[ 0 ].attributes.metadata,
							categories,
						},
					};
					replaceBlocks( clientId, randomPattern.blocks );
				} }
			/>
		</ToolbarGroup>
	);
}
