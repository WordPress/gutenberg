/**
 * External dependencies
 */
import { autocompletion } from '@codemirror/autocomplete';
import {
	defaultKeymap,
	history,
	historyKeymap,
} from '@codemirror/commands';
import { css as cssLanguage } from '@codemirror/lang-css';
import {
	bracketMatching,
	defaultHighlightStyle,
	indentOnInput,
	syntaxHighlighting,
} from '@codemirror/language';
import { searchKeymap } from '@codemirror/search';
import {
	EditorView,
	highlightActiveLine,
	keymap,
	lineNumbers,
} from '@codemirror/view';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

export default function CodeMirrorEditor( {
	value,
	onChange,
	onBlur,
	label,
	help,
	className,
} ) {
	const containerRef = useRef( null );

	const onChangeRef = useRef( onChange );
	const onBlurRef = useRef( onBlur );
	onChangeRef.current = onChange;
	onBlurRef.current = onBlur;
	const initialDocRef = useRef( value ?? '' );

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
	}, [] );

	return (
		<div className={ className }>
			<div ref={ containerRef } aria-label={ label } />
			{ help && <p>{ help }</p> }
		</div>
	);
}
