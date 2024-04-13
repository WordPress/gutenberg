/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

function findHookedBlocks( blocks ) {
	let hookedBlocks = new Set();
	blocks.forEach( ( block ) => {
		if (
			Array.isArray( block.attributes?.metadata?.ignoredHookedBlocks )
		) {
			const hookedBlocksForBlock = new Set(
				block.attributes.metadata.ignoredHookedBlocks
			);
			hookedBlocks = hookedBlocks.union( hookedBlocksForBlock );
		}
		hookedBlocks = hookedBlocks.union(
			findHookedBlocks( block.innerBlocks )
		);
	} );
	return hookedBlocks;
}

function TemplateHookedBlocks() {
	const { hookedBlocks } = useSelect( ( select ) => {
		const { getBlocks } = select( blockEditorStore );
		const { getBlockType } = select( blocksStore );

		const hookedBlockNames = Array.from( findHookedBlocks( getBlocks() ) );
		const _hookedBlocks = hookedBlockNames.map( ( blockName ) =>
			getBlockType( blockName )
		);

		return {
			hookedBlocks: _hookedBlocks,
		};
	} );

	return (
		<PanelBody title={ __( 'Blocks added' ) }>
			{ hookedBlocks.map( ( block ) => {
				return <div key={ block.name }>{ block.title }</div>;
			} ) }
		</PanelBody>
	);
}

export default TemplateHookedBlocks;
