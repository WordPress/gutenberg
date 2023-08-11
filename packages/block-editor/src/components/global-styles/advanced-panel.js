/**
 * External dependencies
 */
import { EditorView, basicSetup } from 'codemirror';
import { css } from '@codemirror/lang-css';

/**
 * WordPress dependencies
 */
import {
	TextareaControl,
	Tooltip,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, info } from '@wordpress/icons';
import { lazy, Suspense } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { default as transformStyles } from '../../utils/transform-styles';

const CSSEditor = lazy( () => import( './custom-css-editor' ) );

export default function AdvancedPanel( {
	value,
	onChange,
	inheritedValue = value,
} ) {
	const editorRef = useRef();
	useEffect( () => {
		if ( editorRef.current ) {
			new EditorView( {
				extensions: [ basicSetup, css() ],
				parent: editorRef.current,
			} );
		}
	}, [ editorRef.current ] );

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

	return (
		<VStack spacing={ 3 }>
			<Suspense>
				<CSSEditor />
			</Suspense>

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
