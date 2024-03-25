/**
 * WordPress dependencies
 */
import { Notice, __experimentalVStack as VStack } from '@wordpress/components';
import { useState, useEffect, useRef, useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { default as transformStyles } from '../../utils/transform-styles';

export default function AdvancedPanel( {
	value,
	onChange,
	inheritedValue = value,
} ) {
	// Custom CSS
	const [ cssError, setCSSError ] = useState( null );
	const customCSS = inheritedValue?.css;
	function handleOnChange( newValue ) {
		onChange( {
			...value,
			css: newValue,
		} );
		if ( cssError ) {
			const [ transformed ] = transformStyles(
				[ { css: newValue } ],
				'.editor-styles-wrapper'
			);
			if ( transformed ) {
				setCSSError( null );
			}
		}
	}
	function handleOnBlur( event ) {
		if ( ! event?.target?.value ) {
			setCSSError( null );
			return;
		}

		const [ transformed ] = transformStyles(
			[ { css: event.target.value } ],
			'.editor-styles-wrapper'
		);

		setCSSError(
			transformed === null
				? __( 'There is an error with your CSS structure.' )
				: null
		);
	}

	const editorRef = useRef();
	useEffect( () => {
		( async () => {
			const { EditorView, basicSetup } = await import( 'codemirror' );
			const { css } = await import( '@codemirror/lang-css' );

			if ( editorRef.current ) {
				new EditorView( {
					doc: customCSS,
					extensions: [
						basicSetup,
						css(),
						EditorView.updateListener.of( ( editor ) => {
							if ( editor.docChanged ) {
								handleOnChange( editor.state.doc.toString() );
							}
						} ),
					],
					parent: editorRef.current,
				} );
			}
		} )();
		// We only want to run this once, so we can ignore the dependency array.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const cssEditorId = useId();
	return (
		<VStack spacing={ 3 }>
			{ cssError && (
				<Notice status="error" onRemove={ () => setCSSError( null ) }>
					{ cssError }
				</Notice>
			) }
			<label htmlFor={ cssEditorId }>{ __( 'Additional CSS' ) }</label>
			<div
				ref={ editorRef }
				onBlur={ handleOnBlur }
				id={ cssEditorId }
			></div>
		</VStack>
	);
}
