/**
 * WordPress dependencies
 */
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { cloneBlock, createBlock } from '@wordpress/blocks';
import { useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import PatternsExplorerModal from '../inserter/block-patterns-explorer';
import { INSERTER_PATTERN_TYPES } from '../inserter/block-patterns-tab/utils';

const EMPTY_ARRAY = [];

export default function ReplacePattern( { clientId } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { categories, rootClientId } = useSelect(
		( select ) => {
			const { getBlockAttributes, getBlockRootClientId } =
				select( blockEditorStore );
			const attributes = getBlockAttributes( clientId );

			return {
				categories: attributes?.metadata?.categories || EMPTY_ARRAY,
				rootClientId: getBlockRootClientId( clientId ),
			};
		},
		[ clientId ]
	);
	const { replaceBlocks } = useDispatch( blockEditorStore );

	if ( categories.length === 0 ) {
		return null;
	}

	const onPatternSelect = ( pattern, blocks ) => {
		const patternBlocks =
			pattern.type === INSERTER_PATTERN_TYPES.user &&
			pattern.syncStatus !== 'unsynced'
				? [ createBlock( 'core/block', { ref: pattern.id } ) ]
				: blocks ?? pattern.blocks ?? [];
		const newBlocks = patternBlocks.map( ( block ) => cloneBlock( block ) );
		if ( newBlocks[ 0 ] ) {
			newBlocks[ 0 ].attributes.metadata = {
				...newBlocks[ 0 ].attributes.metadata,
				categories,
			};
		}
		replaceBlocks( clientId, newBlocks );
	};

	return (
		<>
			<ToolbarGroup>
				<ToolbarButton onClick={ () => setIsModalOpen( true ) }>
					{ __( 'Replace' ) }
				</ToolbarButton>
			</ToolbarGroup>
			{ isModalOpen && (
				<PatternsExplorerModal
					rootClientId={ rootClientId }
					initialCategory={
						categories[ 0 ] ? { name: categories[ 0 ] } : undefined
					}
					onPatternSelect={ onPatternSelect }
					onModalClose={ () => setIsModalOpen( false ) }
				/>
			) }
		</>
	);
}
