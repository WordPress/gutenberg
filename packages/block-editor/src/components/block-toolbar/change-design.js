/**
 * WordPress dependencies
 */
import {
	ToolbarButton,
	ToolbarGroup,
	Dropdown,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { cloneBlock } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockPatternsList from '../block-patterns-list';

const EMPTY_ARRAY = [];
const MAX_PATTERNS_TO_SHOW = 6;
const POPOVER_PROPS = {
	placement: 'bottom-start',
};

export default function ChangeDesign( { clientId } ) {
	const { categories, currentPatternName, patterns } = useSelect(
		( select ) => {
			const {
				getBlockAttributes,
				getBlockRootClientId,
				__experimentalGetAllowedPatterns,
			} = select( blockEditorStore );
			const attributes = getBlockAttributes( clientId );
			const _categories = attributes?.metadata?.categories || EMPTY_ARRAY;
			const rootBlock = getBlockRootClientId( clientId );

			// Calling `__experimentalGetAllowedPatterns` is expensive.
			// Checking if the block can be changed prevents unnecessary selector calls.
			// See: https://github.com/WordPress/gutenberg/pull/64736.
			const _patterns =
				_categories.length > 0
					? __experimentalGetAllowedPatterns( rootBlock )
					: EMPTY_ARRAY;
			return {
				categories: _categories,
				currentPatternName: attributes?.metadata?.patternName,
				patterns: _patterns,
			};
		},
		[ clientId ]
	);
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const sameCategoryPatternsWithSingleWrapper = useMemo( () => {
		if ( categories.length === 0 || ! patterns || patterns.length === 0 ) {
			return EMPTY_ARRAY;
		}
		return patterns
			.filter( ( pattern ) => {
				const isCorePattern =
					pattern.source === 'core' ||
					( pattern.source?.startsWith( 'pattern-directory' ) &&
						pattern.source !== 'pattern-directory/theme' );
				return (
					// Check if the pattern has only one top level block,
					// otherwise we may switch to a pattern that doesn't have replacement suggestions.
					pattern.blocks.length === 1 &&
					// We exclude the core patterns and pattern directory patterns that are not theme patterns.
					! isCorePattern &&
					// Exclude current pattern.
					currentPatternName !== pattern.name &&
					pattern.categories?.some( ( category ) => {
						return categories.includes( category );
					} ) &&
					// Check if the pattern is not a synced pattern.
					( pattern.syncStatus === 'unsynced' || ! pattern.id )
				);
			} )
			.slice( 0, MAX_PATTERNS_TO_SHOW );
	}, [ categories, currentPatternName, patterns ] );

	if ( sameCategoryPatternsWithSingleWrapper.length < 2 ) {
		return null;
	}

	const onClickPattern = ( pattern ) => {
		const newBlocks = ( pattern.blocks ?? [] ).map( ( block ) => {
			return cloneBlock( block );
		} );
		newBlocks[ 0 ].attributes.metadata = {
			...newBlocks[ 0 ].attributes.metadata,
			categories,
		};
		replaceBlocks( clientId, newBlocks );
	};

	return (
		<Dropdown
			popoverProps={ POPOVER_PROPS }
			renderToggle={ ( { onToggle, isOpen } ) => {
				return (
					<ToolbarGroup>
						<ToolbarButton
							onClick={ () => onToggle( ! isOpen ) }
							aria-expanded={ isOpen }
						>
							{ __( 'Change design' ) }
						</ToolbarButton>
					</ToolbarGroup>
				);
			} }
			renderContent={ () => (
				<DropdownContentWrapper
					className="block-editor-block-toolbar-change-design-content-wrapper"
					paddingSize="none"
				>
					<BlockPatternsList
						blockPatterns={ sameCategoryPatternsWithSingleWrapper }
						onClickPattern={ onClickPattern }
						showTitlesAsTooltip
					/>
				</DropdownContentWrapper>
			) }
		/>
	);
}
