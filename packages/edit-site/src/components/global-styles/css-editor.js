/**
 * External dependencies
 */
import { EditorView, basicSetup } from 'codemirror';
import { css } from '@codemirror/lang-css';

/**
 * WordPress dependencies
 */

import { useEffect, useRef, Suspense } from '@wordpress/element';

function CSSEditor() {
	const editorRef = useRef();
	useEffect( () => {
		if ( editorRef.current ) {
			new EditorView( {
				extensions: [ basicSetup, css() ],
				parent: editorRef.current,
			} );
		}
	}, [ editorRef.current ] );

	return (
		<Suspense fallback={ <div>Loading</div> }>
			<textinput ref={ editorRef }></textinput>
		</Suspense>
	);
}

export default CSSEditor;
