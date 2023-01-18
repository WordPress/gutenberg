/**
 * External dependencies
 */
import { EditorView, basicSetup } from 'codemirror';
import { css } from '@codemirror/lang-css';

/**
 * WordPress dependencies
 */

import { useEffect, useRef, Suspense } from '@wordpress/element';

function CSSEditor( { value } ) {
	const editorRef = useRef();
	useEffect( () => {
		if ( editorRef.current ) {
			new EditorView( {
				extensions: [ basicSetup, css() ],
				parent: editorRef.current,
				doc: value,
			} );
		}
	}, [ editorRef.current ] );

	return (
		<Suspense fallback={ <div>Loading</div> }>
			<div ref={ editorRef }></div>
		</Suspense>
	);
}

export default CSSEditor;
