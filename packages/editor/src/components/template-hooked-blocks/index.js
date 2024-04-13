/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

function _findAnchorBlocks( block ) {
	let hookedBlocks = new Set();
	if ( Array.isArray( block.attributes?.metadata?.ignoredHookedBlocks ) ) {
		block.attributes.metadata.ignoredHookedBlocks.forEach(
			( hookedBlock ) => {
				hookedBlocks.add( hookedBlock );
			}
		);
	}
	block.innerBlocks.forEach( ( innerBlock ) => {
		hookedBlocks = hookedBlocks.union( _findAnchorBlocks( innerBlock ) );
	} );
	return hookedBlocks;
}

function findAnchorBlocks( blocks ) {
	let hookedBlocks = new Set();
	blocks.forEach( ( block ) => {
		hookedBlocks = hookedBlocks.union( _findAnchorBlocks( block ) );
	} );
	return hookedBlocks;
}

function TemplateHookedBlocks() {
	const { blocks } = useSelect( ( select ) => {
		const { getBlocks } = select( blockEditorStore );

		return {
			blocks: getBlocks(),
		};
	} );

	console.log( blocks );
	console.log( findAnchorBlocks( blocks ) );

	return (
		<PanelBody title={ __( 'Blocks added' ) }>
			<p>Template Hooked Blocks</p>
		</PanelBody>
	);
}

export default TemplateHookedBlocks;
