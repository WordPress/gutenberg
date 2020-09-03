/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Preview } from '@wordpress/block-editor';
import { rawHandler } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import Editor from './editor';

class EditorPreview extends Component {
	render() {
		const { template, editorMode, postId, postType, ...props } = this.props;

		if ( editorMode === 'preview' ) {
			return <Preview blocks={ rawHandler( { HTML: template } ) } />;
		}

		return <Editor postId={ postId } postType={ postType } { ...props } />;
	}
}

export default EditorPreview;
