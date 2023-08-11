/**
 * External dependencies
 */
import { EditorView, basicSetup } from 'codemirror';
import { css } from '@codemirror/lang-css';

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function CustomCSSEditor( { value } ) {
	const editorRef = useRef();
	useEffect( () => {
		if ( editorRef.current ) {
			new EditorView( {
				extensions: [ basicSetup, css() ],
				parent: editorRef.current,
			} );
		}
	}, [ editorRef.current ] );

	return <div ref={ editorRef } contentEditable="true"></div>;
}
