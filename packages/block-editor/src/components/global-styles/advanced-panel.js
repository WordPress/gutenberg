/**
 * WordPress dependencies
 */
import { Notice, __experimentalVStack as VStack } from '@wordpress/components';
import { useState, Suspense, lazy } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { default as transformStyles } from '../../utils/transform-styles';

const EditorView = lazy( () => import( './editor-view' ) );

const EDITOR_ID =
	'block-editor-global-styles-advanced-panel__custom-css-editor';
const EDITOR_INSTRUCTIONS_ID = `${ EDITOR_ID }-instructions`;

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
	function handleOnBlur( newValue ) {
		if ( ! newValue ) {
			setCSSError( null );
			return;
		}
		const [ transformed ] = transformStyles(
			[ { css: newValue } ],
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
			{ cssError && (
				<Notice status="error" onRemove={ () => setCSSError( null ) }>
					{ cssError }
				</Notice>
			) }
			<label
				htmlFor={ EDITOR_ID }
				className="block-editor-global-styles-advanced-panel__custom-css-label"
			>
				{ __( 'Additional CSS' ) }
			</label>
			<Suspense fallback={ null }>
				<EditorView
					editorId={EDITOR_ID}
					editorInstructionsId={EDITOR_INSTRUCTIONS_ID}
					customCSS={ customCSS }
					onChange={ handleOnChange }
					onBlur={ handleOnBlur }
					/>
			</Suspense>
		</VStack>
	);
}
