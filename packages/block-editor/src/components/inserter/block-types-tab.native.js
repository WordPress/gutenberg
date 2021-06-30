/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';
import useClipboardBlock from './hooks/use-clipboard-block';
import { store as blockEditorStore } from '../../store';
import {
	requestBlockTypeImpressions,
	setBlockTypeImpressionCount,
} from '@wordpress/react-native-bridge';

const NON_BLOCK_CATEGORIES = [ 'reusable' ];

function BlockTypesTab( { onSelect, rootClientId, listProps } ) {
	const clipboardBlock = useClipboardBlock( rootClientId );
	const [ blockTypeImpressions, setBlockTypeImpressions ] = useState( {} );

	// Request current block impressions from native app
	useEffect( () => {
		let isCurrent = true;

		requestBlockTypeImpressions( ( impressions ) => {
			if ( isCurrent ) {
				setBlockTypeImpressions( impressions );
			}
		} );

		return () => {
			isCurrent = false;
		};
	}, [] );

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
				isNew: blockTypeImpressions[ b.name ] > 0,
		  } ) )
		: blockTypes;

	const handleSelect = ( ...args ) => {
		const [ { name } ] = args;
		setBlockTypeImpressions( ( impressions ) => {
			if ( impressions[ name ] > 0 ) {
				return {
					...impressions,
					[ name ]: impressions[ name ] - 1,
				};
			}

			return blockTypeImpressions;
		} );
		// Persist updated block impression count for the block
		setBlockTypeImpressionCount( name, blockTypeImpressions[ name ] - 1 );
		onSelect( ...args );
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
