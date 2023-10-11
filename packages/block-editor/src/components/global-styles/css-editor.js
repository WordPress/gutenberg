/**
 * External dependencies
 */
import { EditorView, basicSetup } from 'codemirror';
import { css } from '@codemirror/lang-css';

/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect, useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Tooltip, __experimentalVStack as VStack } from '@wordpress/components';
import { Icon, info } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { default as transformStyles } from '../../utils/transform-styles';

export default function CSSEditor( { value, onChange } ) {
	const editorRef = useRef();

	// Custom CSS
	const [ cssError, setCSSError ] = useState( null );

	useEffect( () => {
		if ( editorRef.current ) {
			new EditorView( {
				doc: value,
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
		// We only want to run this once, so we can ignore the dependency array.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	function handleOnChange( newValue ) {
		onChange( {
			...value,
			css: newValue,
		} );
		if ( cssError ) {
			const [ transformed ] = transformStyles(
				[ { css: value } ],
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
	const cssEditorId = useId();
	return (
		<VStack
			spacing={ 3 }
			className=".block-editor-global-styles-advanced-panel__custom-css-editor"
		>
			<label htmlFor={ cssEditorId }>
				{ __( 'Additional CSS' ) }
				<div
					ref={ editorRef }
					onBlur={ handleOnBlur }
					id={ cssEditorId }
				></div>
			</label>
			{ cssError && (
				<Tooltip text={ cssError }>
					<div className="block-editor-global-styles-advanced-panel__custom-css-validation-wrapper">
						<Icon
							icon={ info }
							className="block-editor-global-styles-advanced-panel__custom-css-validation-icon"
						/>
					</div>
				</Tooltip>
			) }
		</VStack>
	);
}
