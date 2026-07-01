/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import {
	insert,
	insertObject,
	slice,
	getTextContent,
	useAnchor,
} from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import {
	Popover,
	TextControl,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { math as icon } from '@wordpress/icons';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { Badge: WCBadge } = unlock( componentsPrivateApis );

const name = 'core/math';
const title = __( 'Math' );

function InlineUI( {
	value,
	onChange,
	activeAttributes,
	contentRef,
	latexToMathML,
} ) {
	const [ latex, setLatex ] = useState(
		activeAttributes?.[ 'data-latex' ] || ''
	);
	const [ error, setError ] = useState( null );

	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
		settings: math,
	} );

	// Update the math object in real-time as the user types
	const handleLatexChange = ( newLatex ) => {
		let mathML = '';

		setLatex( newLatex );

		if ( newLatex ) {
			try {
				mathML = latexToMathML( newLatex, { displayMode: false } );
				setError( null );
			} catch ( err ) {
				setError( err.message );
				speak(
					sprintf(
						/* translators: %s: error message returned when parsing LaTeX. */
						__( 'Error parsing mathematical expression: %s' ),
						err.message
					)
				);
				return;
			}
		}

		const newReplacements = value.replacements.slice();
		newReplacements[ value.start ] = {
			type: name,
			attributes: {
				'data-latex': newLatex,
			},
			innerHTML: mathML,
		};

		onChange( {
			...value,
			replacements: newReplacements,
		} );
	};

	return (
		<Popover
			placement="bottom-start"
			offset={ 8 }
			focusOnMount={ false }
			anchor={ popoverAnchor }
			className="block-editor-format-toolbar__math-popover"
		>
			<div style={ { minWidth: '300px', padding: '4px' } }>
				<Stack direction="column" gap="xs">
					<TextControl
						hideLabelFromVision
						label={ __( 'LaTeX math syntax' ) }
						value={ latex }
						onChange={ handleLatexChange }
						placeholder={ __( 'e.g., x^2, \\frac{a}{b}' ) }
						autoComplete="off"
						className="block-editor-format-toolbar__math-input"
					/>
					{ error && (
						<>
							<WCBadge
								intent="error"
								className="wp-block-math__error"
							>
								{ sprintf(
									/* translators: %s: error message returned when parsing LaTeX. */
									__( 'Error: %s' ),
									error
								) }
							</WCBadge>
							<style children=".wp-block-math__error .components-badge__content{white-space:normal}" />
						</>
					) }
				</Stack>
			</div>
		</Popover>
	);
}

function Edit( {
	value,
	onChange,
	onFocus,
	isObjectActive,
	activeObjectAttributes,
	contentRef,
} ) {
	const [ latexToMathML, setLatexToMathML ] = useState();

	useEffect( () => {
		import( '@wordpress/latex-to-mathml' ).then( ( module ) => {
			setLatexToMathML( () => module.default );
		} );
	}, [] );

	function onClick() {
		let newValue;

		if ( isObjectActive ) {
			// Revert the active math object to its LaTeX source so clicking
			// the button toggles back to the exact text it was created from.
			// Keep the restored text selected so it can be edited or
			// re-marked right away.
			const latex = activeObjectAttributes?.[ 'data-latex' ] || '';
			newValue = insert( value, latex );
			newValue.start = newValue.end - latex.length;
		} else {
			// If there's a selection, seed the format with it so you can type
			// LaTeX inline and then mark it as math.
			const selectedText = getTextContent( slice( value ) );
			let innerHTML = '';
			if ( selectedText && latexToMathML ) {
				try {
					innerHTML = latexToMathML( selectedText, {
						displayMode: false,
					} );
				} catch {
					// Leave unrendered; the popover opens with the text
					// prefilled so the expression can be corrected.
				}
			}
			newValue = insertObject( value, {
				type: name,
				attributes: { 'data-latex': selectedText },
				innerHTML,
			} );
			newValue.start = newValue.end - 1;
		}

		onChange( newValue );
		onFocus();
	}

	return (
		<>
			<RichTextToolbarButton
				icon={ icon }
				title={ title }
				onClick={ onClick }
				isActive={ isObjectActive }
			/>
			{ isObjectActive && (
				<InlineUI
					value={ value }
					onChange={ onChange }
					activeAttributes={ activeObjectAttributes }
					contentRef={ contentRef }
					latexToMathML={ latexToMathML }
				/>
			) }
		</>
	);
}

export const math = {
	name,
	title,
	tagName: 'math',
	className: null,
	attributes: {
		'data-latex': 'data-latex',
	},
	contentEditable: false,
	edit: Edit,
};
