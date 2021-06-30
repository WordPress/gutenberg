/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';
import useClipboardBlock from './hooks/use-clipboard-block';
import { store as blockEditorStore } from '../../store';

const NON_BLOCK_CATEGORIES = [ 'reusable' ];

function BlockTypesTab( { onSelect, rootClientId, listProps } ) {
	const clipboardBlock = useClipboardBlock( rootClientId );
	// TODO(David): Set initial state from native impression count
	const [ blockImpressions, setBlockImpressions ] = useState( {
		'core/paragraph': 1,
	} );

	const { enableEditorOnboarding, blockTypes } = useSelect(
		( select ) => {
			const {
				getInserterItems,
				getSettings: getBlockEditorSettings,
			} = select( blockEditorStore );

			const allItems = getInserterItems( rootClientId );
			const blockItems = allItems.filter(
				( { category } ) => ! NON_BLOCK_CATEGORIES.includes( category )
			);

			return {
				enableEditorOnboarding: getBlockEditorSettings()
					.editorOnboarding,
				blockTypes: clipboardBlock
					? [ clipboardBlock, ...blockItems ]
					: blockItems,
			};
		},
		[ rootClientId ]
	);
	const items = enableEditorOnboarding
		? blockTypes.map( ( b ) => ( {
				...b,
				isNew: blockImpressions[ b.name ] > 0,
		  } ) )
		: blockTypes;

	const handleSelect = ( blockType, ...args ) => {
		setBlockImpressions( ( impressions ) => {
			if ( impressions[ blockType.name ] > 0 ) {
				return {
					...impressions,
					[ blockType.name ]: impressions[ blockType.name ] - 1,
				};
			}

			return blockImpressions;
		} );
		onSelect( blockType, ...args );
	};

	return (
		<BlockTypesList
			name="Blocks"
			items={ items }
			onSelect={ handleSelect }
			listProps={ listProps }
		/>
	);
}

export default BlockTypesTab;
