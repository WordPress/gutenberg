/**
 * WordPress dependencies
 */
import { VisuallyHidden } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PlainText from '../plain-text';

async function importLanguageSupport( mode ) {
	switch ( mode ) {
		case 'css':
			const { css } = await import( '@codemirror/lang-css' );
			return css();
		case 'javascript':
		case 'js':
			const { javascript } = await import(
				'@codemirror/lang-javascript'
			);
			return javascript();
		case 'html':
		default:
			const { html } = await import( '@codemirror/lang-html' );
			return html( { autoCloseTags: false } );
	}
}

export default function CodeEditor( {
	className,
	editorId,
	editorInstructionsText,
	mode = 'html',
	value = '',
	onChange,
	placeholder,
	'aria-label': ariaLabel,
} ) {
	const containerRef = useRef( null );
	const editorViewRef = useRef( null );
	const onChangeRef = useRef( onChange );
	const valueRef = useRef( value );
	const isApplyingExternalChangeRef = useRef( false );
	const [ hasLoadError, setHasLoadError ] = useState( false );
	const instructionsId = useInstanceId( CodeEditor );
	const editorClassName = [
		className,
		'block-editor-code-editor',
		'block-editor-code-editor__codemirror',
	]
		.filter( Boolean )
		.join( ' ' );

	useEffect( () => {
		onChangeRef.current = onChange;
	}, [ onChange ] );

	useEffect( () => {
		valueRef.current = value;
	}, [ value ] );

	useEffect( () => {
		let isMounted = true;
		let observer;

		( async () => {
			try {
				const [
					{ EditorView, keymap, lineNumbers },
					{ EditorState },
					{
						history,
						defaultKeymap,
						historyKeymap,
						indentWithTab,
						insertNewlineKeepIndent,
					},
					{ syntaxHighlighting, defaultHighlightStyle },
					languageExtension,
				] = await Promise.all( [
					import( '@codemirror/view' ),
					import( '@codemirror/state' ),
					import( '@codemirror/commands' ),
					import( '@codemirror/language' ),
					importLanguageSupport( mode ),
				] );

				if ( ! isMounted || ! containerRef.current ) {
					return;
				}

				const contentAttributes = {};
				if ( ariaLabel ) {
					contentAttributes[ 'aria-label' ] = ariaLabel;
				}
				if ( editorInstructionsText ) {
					contentAttributes[ 'aria-describedby' ] =
						String( instructionsId );
				}

				const view = new EditorView( {
					state: EditorState.create( {
						doc: valueRef.current,
						extensions: [
							languageExtension,
							history(),
							lineNumbers(),
							EditorView.lineWrapping,
							EditorView.contentAttributes.of(
								contentAttributes
							),
							syntaxHighlighting( defaultHighlightStyle ),
							keymap.of( [
								{
									key: 'Enter',
									run: insertNewlineKeepIndent,
									shift: insertNewlineKeepIndent,
								},
								{
									key: 'Escape',
									run: ( editorView ) => {
										editorView.contentDOM.blur();
										return true;
									},
								},
								...defaultKeymap,
								...historyKeymap,
								indentWithTab,
							] ),
							EditorView.updateListener.of( ( update ) => {
								if (
									update.docChanged &&
									! isApplyingExternalChangeRef.current
								) {
									onChangeRef.current?.(
										update.state.doc.toString()
									);
								}
							} ),
						],
					} ),
					parent: containerRef.current,
				} );

				editorViewRef.current = view;

				observer = new window.MutationObserver( () => {
					// Keep this observer for future theme-dependent behavior.
				} );
				observer.observe( document.body, {
					attributes: true,
					attributeFilter: [ 'class' ],
				} );
			} catch {
				if ( isMounted ) {
					setHasLoadError( true );
				}
			}
		} )();

		return () => {
			isMounted = false;
			observer?.disconnect();
			editorViewRef.current?.destroy();
			editorViewRef.current = null;
		};
	}, [ mode, ariaLabel, editorInstructionsText, instructionsId ] );

	useEffect( () => {
		const view = editorViewRef.current;
		if ( ! view ) {
			return;
		}

		const currentValue = view.state.doc.toString();
		if ( value === currentValue ) {
			return;
		}

		isApplyingExternalChangeRef.current = true;
		view.dispatch( {
			changes: { from: 0, to: currentValue.length, insert: value },
		} );
		isApplyingExternalChangeRef.current = false;
	}, [ value ] );

	if ( hasLoadError ) {
		return (
			<PlainText
				value={ value }
				onChange={ onChange }
				placeholder={ placeholder }
				aria-label={ ariaLabel }
				className={ className }
			/>
		);
	}

	return (
		<>
			{ editorInstructionsText && (
				<VisuallyHidden id={ instructionsId }>
					{ editorInstructionsText }
					{ __(
						'In the editing area, the Tab key enters a tab character. Press Escape then Tab to move focus out of the editor.'
					) }
				</VisuallyHidden>
			) }
			<div
				ref={ containerRef }
				id={ editorId }
				className={ editorClassName }
			/>
		</>
	);
}
