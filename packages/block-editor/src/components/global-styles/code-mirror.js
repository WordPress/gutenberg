import { EditorView, basicSetup } from 'codemirror';
import { indentWithTab } from '@codemirror/commands';
import { keymap } from '@codemirror/view';

function importLanguageSupport( mode ) {
	switch ( mode ) {
		case 'html':
			return import(
				/* webpackChunkName: "codemirror-lang-html" */ '@codemirror/lang-html'
			);
		case 'css':
		default:
			return import(
				/* webpackChunkName: "codemirror-lang-css" */ '@codemirror/lang-css'
			);
	}
}

export default async function createEditorView( {
	parent,
	mode,
	content,
	onChange,
	onBlur,
} ) {
	const languageSupport = await importLanguageSupport( mode );

	return new EditorView( {
		doc: content,
		extensions: [
			basicSetup,
			languageSupport[ mode ](),
			keymap.of( [ indentWithTab ] ),
			EditorView.updateListener.of( ( editor ) => {
				if ( editor.docChanged ) {
					onChange( editor.state.doc.toString() );
				}
			} ),
			...( onBlur
				? [
						EditorView.focusChangeEffect.of(
							( editorState, focusing ) => {
								if ( ! focusing ) {
									onBlur( editorState.doc.toString() );
								}
								return null;
							}
						),
				  ]
				: [] ),
		],
		parent,
	} );
}
