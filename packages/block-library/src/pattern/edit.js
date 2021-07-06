/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	store as blockEditorStore,
	BlockList,
	BlockEditorProvider,
} from '@wordpress/block-editor';

const PatternEdit = ( { attributes } ) => {
	const selectedPattern = useSelect( ( select ) =>
		select( blockEditorStore ).__experimentalGetParsedPattern( attributes.slug )
	);

	return (
		<BlockEditorProvider value={ selectedPattern.blocks }>
			<BlockList />
		</BlockEditorProvider>
	);
};

export default PatternEdit;
