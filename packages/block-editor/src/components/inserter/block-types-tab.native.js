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
	setBlockTypeImpressions,
} from '@wordpress/react-native-bridge';

const NON_BLOCK_CATEGORIES = [ 'reusable' ];

function BlockTypesTab( { onSelect, rootClientId, listProps } ) {
	const clipboardBlock = useClipboardBlock( rootClientId );
	const [ blockImpressions, setBlockImpressions ] = useState( {} );

	// Request current block impressions from native app
	useEffect( () => {
		let isCurrent = true;

		requestBlockTypeImpressions( ( impressions ) => {
			if ( isCurrent ) {
				setBlockImpressions( impressions );
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
				isNew: blockImpressions[ b.name ] > 0,
		  } ) )
		: blockTypes;

	const handleSelect = ( ...args ) => {
		const [ { name } ] = args;
		setBlockImpressions( ( impressions ) => {
			if ( impressions[ name ] > 0 ) {
				return {
					...impressions,
					[ name ]: impressions[ name ] - 1,
				};
			}

			return blockImpressions;
		} );
		// Persist updated block impression count for the block
		setBlockTypeImpressions( name, blockImpressions[ name ] - 1 );
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
