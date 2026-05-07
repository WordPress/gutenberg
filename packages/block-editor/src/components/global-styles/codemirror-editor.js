/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * The CodeMirror namespace bag from `@wordpress/codemirror`. Set by the
 * dynamic-import wrapper in `advanced-panel.js` before this component is
 * first rendered, so that the file itself never imports `@wordpress/codemirror`
 * statically (which would not resolve from `block-editor`'s IIFE bundle).
 *
 * @type {?import('@wordpress/codemirror').__WORDPRESS_PRIVATE_DO_NOT_USE}
 */
let codemirror;

export function setCodemirror( cm ) {
	codemirror = cm;
}

export default function CodeMirrorEditor( {
	value,
	onChange,
	onBlur,
	label,
	help,
	className,
} ) {
	const {
		autocomplete: { autocompletion },
		commands: { defaultKeymap, history, historyKeymap },
		langCss: { css: cssLanguage },
		language: {
			bracketMatching,
			defaultHighlightStyle,
			indentOnInput,
			syntaxHighlighting,
		},
		search: { searchKeymap },
		view: { EditorView, highlightActiveLine, keymap, lineNumbers },
	} = codemirror;

	const containerRef = useRef( null );

	const onChangeRef = useRef( onChange );
	const onBlurRef = useRef( onBlur );
	const initialDocRef = useRef( value ?? '' );

	useEffect( () => {
		onChangeRef.current = onChange;
		onBlurRef.current = onBlur;
	} );

	useEffect( () => {
		const view = new EditorView( {
			doc: initialDocRef.current,
			extensions: [
				lineNumbers(),
				highlightActiveLine(),
				history(),
				bracketMatching(),
				indentOnInput(),
				syntaxHighlighting( defaultHighlightStyle ),
				autocompletion(),
				cssLanguage(),
				keymap.of( [
					...defaultKeymap,
					...historyKeymap,
					...searchKeymap,
				] ),
				EditorView.updateListener.of( ( update ) => {
					if ( update.docChanged ) {
						onChangeRef.current?.( update.state.doc.toString() );
					}
				} ),
				EditorView.domEventHandlers( {
					blur( _event, instance ) {
						onBlurRef.current?.( instance.state.doc.toString() );
					},
				} ),
			],
			parent: containerRef.current,
		} );

		return () => {
			view.destroy();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- One-shot init.
	}, [] );

	return (
		<div className={ className }>
			<div ref={ containerRef } aria-label={ label } />
			{ help && <p>{ help }</p> }
		</div>
	);
}
