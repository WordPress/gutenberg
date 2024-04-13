/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

function findAnchorBlocks( blocks ) {
	let hookedBlocks = new Set();
	blocks.forEach( ( block ) => {
		if (
			Array.isArray( block.attributes?.metadata?.ignoredHookedBlocks )
		) {
			block.attributes.metadata.ignoredHookedBlocks.forEach(
				( hookedBlock ) => {
					hookedBlocks.add( hookedBlock );
				}
			);
		}
		hookedBlocks = hookedBlocks.union(
			findAnchorBlocks( block.innerBlocks )
		);
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
