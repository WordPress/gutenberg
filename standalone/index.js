import { Component } from '@wordpress/element';
import '@wordpress/data';
import '@wordpress/core-data';
/**
 * TODO: core-blocks in are throwing an error because this is undefined. This can happen in strict mode, since that
 * safeguards against accidental assignment to window, when calling a class init incorrectly
 *
 * this.wp=this.wp||{},this.wp.coreBlocks=function(e){
 *
 * See where this code is generated. I can't find it in the src code, likely generated from a script?
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
