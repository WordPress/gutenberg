/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import {
	store as blockEditorStore,
	__experimentalBlockPatternSetup as BlockPatternSetup,
} from '@wordpress/block-editor';
import { cloneBlock } from '@wordpress/blocks';
import { useEffect } from '@wordpress/element';

export default function PatternsSetup( {
	blockNameWithArea,
	clientId,
	setStartBlank,
} ) {
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );

	const onSelect = ( blocks ) => {
		const clonedBlocks = blocks.map( ( block ) => cloneBlock( block ) );
		replaceInnerBlocks( clientId, clonedBlocks );
	};

	return (
		<BlockPatternSetup
			blockName={ 'core/template-part' }
			clientId={ clientId }
			startBlankComponent={
				<StartBlankComponent setStartBlank={ setStartBlank } />
			}
			onBlockPatternSelect={ onSelect }
			filterPatternsFn={ ( pattern ) =>
				pattern?.blockTypes?.some?.(
					( blockType ) => blockType === blockNameWithArea
				)
			}
		/>
	);
}

function StartBlankComponent( { setStartBlank } ) {
	useEffect( () => {
		setStartBlank( true );
	}, [] );
	return null;
}
