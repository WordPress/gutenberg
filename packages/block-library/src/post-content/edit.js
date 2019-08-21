/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import {
	BlockEditorProvider,
	WritingFlow,
	BlockList,
} from '@wordpress/block-editor';

export default function PostContentEdit() {
	const [ blocks = [], setBlocks ] = useEntityProp( 'post', 'blocks' );
	return (
		<BlockEditorProvider
			value={ blocks }
			onChange={ setBlocks }
			onInput={ setBlocks }
		>
			<WritingFlow>
				<BlockList />
			</WritingFlow>
		</BlockEditorProvider>
	);
}
