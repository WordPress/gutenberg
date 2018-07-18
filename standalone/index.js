import { Component } from '@wordpress/element';
import '@wordpress/data';
import '@wordpress/core-data';
/**
 * If we see an error being thrown because `this` is undefined
 *
 * this.wp=this.wp||{},this.wp.coreBlocks=function(e){
 *
 * try updating
 *
 * config.output.libraryTarget = 'window';
 *
 */
import { registerCoreBlocks } from '@wordpress/core-blocks';
import { EditorProvider, WritingFlow, ObserveTyping, BlockList } from '@wordpress/editor';

const editorSettings = {};
const wpApiSettings = {
	schema: {
		routes: {},
	},
};
const post = {
	type: 'post',
	content: {},
};

registerCoreBlocks();

class GutenbergEditor extends Component {
	render() {
		return (
			<EditorProvider settings={ editorSettings } wpApiSettings={ wpApiSettings } post={ post }>
				<WritingFlow>
					<ObserveTyping>
						<BlockList />
					</ObserveTyping>
				</WritingFlow>
			</EditorProvider>
		);
	}
}

export default GutenbergEditor;
