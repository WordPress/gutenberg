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

function Container( props ) {
	return (
		<ToolbarGroup>
			<ToolbarButton { ...props } />
		</ToolbarGroup>
	);
}

export default function Shuffle( { clientId, as = Container } ) {
	const { categories, patterns, patternName } = useSelect(
		( select ) => {
			const {
				getBlockAttributes,
				getBlockRootClientId,
				__experimentalGetAllowedPatterns,
			} = select( blockEditorStore );
			const attributes = getBlockAttributes( clientId );
			const _categories = attributes?.metadata?.categories || EMPTY_ARRAY;
			const _patternName = attributes?.metadata?.patternName;
			const rootBlock = getBlockRootClientId( clientId );
			const _patterns = __experimentalGetAllowedPatterns( rootBlock );
			return {
				categories: _categories,
				patterns: _patterns,
				patternName: _patternName,
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
			const isCorePattern =
				pattern.source === 'core' ||
				( pattern.source?.startsWith( 'pattern-directory' ) &&
					pattern.source !== 'pattern-directory/theme' );
			return (
				// Check if the pattern has only one top level block,
				// otherwise we may shuffle to pattern that will not allow to continue shuffling.
				pattern.blocks.length === 1 &&
				// We exclude the core patterns and pattern directory patterns that are not theme patterns.
				! isCorePattern &&
				pattern.categories?.some( ( category ) => {
					return categories.includes( category );
				} ) &&
				// Check if the pattern is not a synced pattern.
				( pattern.syncStatus === 'unsynced' || ! pattern.id )
			);
		} );
	}, [ categories, patterns ] );

	if ( sameCategoryPatternsWithSingleWrapper.length < 2 ) {
		return null;
	}

	function getNextPattern() {
		const numberOfPatterns = sameCategoryPatternsWithSingleWrapper.length;
		const patternIndex = sameCategoryPatternsWithSingleWrapper.findIndex(
			( { name } ) => name === patternName
		);
		const nextPatternIndex =
			patternIndex + 1 < numberOfPatterns ? patternIndex + 1 : 0;
		return sameCategoryPatternsWithSingleWrapper[ nextPatternIndex ];
	}

	const ComponentToUse = as;
	return (
		<ComponentToUse
			label={ __( 'Shuffle' ) }
			icon={ shuffle }
			className="block-editor-block-toolbar-shuffle"
			onClick={ () => {
				const nextPattern = getNextPattern();
				nextPattern.blocks[ 0 ].attributes = {
					...nextPattern.blocks[ 0 ].attributes,
					metadata: {
						...nextPattern.blocks[ 0 ].attributes.metadata,
						categories,
					},
				};
				replaceBlocks( clientId, nextPattern.blocks );
			} }
		/>
	);
}
