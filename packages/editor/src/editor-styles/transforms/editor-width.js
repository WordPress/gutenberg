/**
 * External dependencies
 */
import { find } from 'lodash';

export const getEditorWidthRules = ( width ) => {
	return {
		type: 'rule',
		selectors: [
			'body.gutenberg-editor-page .editor-post-title__block',
			'body.gutenberg-editor-page .editor-default-block-appender',
			'body.gutenberg-editor-page .editor-block-list__block',
		],
		declarations: [
			{
				type: 'declaration',
				property: 'max-width',
				value: width,
			},
		],
	};
};

const editorWidth = ( node ) => {
	if (
		node.type === 'rule' &&
		find( node.selectors, ( selector ) => selector.trim() === 'html' )
	) {
		const widthDeclaration = find(
			node.declarations,
			( declaration ) => declaration.property === 'width'
		);

		if ( widthDeclaration ) {
			return getEditorWidthRules( widthDeclaration.value );
		}
	}

	return node;
};

export default editorWidth;
