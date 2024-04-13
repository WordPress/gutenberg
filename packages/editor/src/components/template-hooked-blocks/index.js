/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { store as blockEditorStore } from '@wordpress/block-editor';
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
		const blocks = getBlocks();

		return {
			hookedBlocks: findHookedBlocks( blocks ),
		};
	} );

	return (
		<PanelBody title={ __( 'Blocks added' ) }>
			{ Array.from( hookedBlocks ).map( ( block ) => {
				return <div key={ block }>{ block }</div>;
			} ) }
		</PanelBody>
	);
}

export default TemplateHookedBlocks;
