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
		const {
			initialHtml,
			editorMode,
			postId,
			postType
		} = this.props;

		if ( editorMode === 'preview' ) {
			return <Preview blocks={ rawHandler( { HTML: initialHtml } ) } />;
		}

		return (
			<Editor postId={ postId } postType={ postType } { ...this.props } />
		);
	}
}

export default EditorPreview;
