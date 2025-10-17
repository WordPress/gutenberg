/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import {
	TextareaControl,
	Popover,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { Badge } = unlock( componentsPrivateApis );

export default function MathEdit( { attributes, setAttributes, isSelected } ) {
	const { latex } = attributes;
	const [ blockRef, setBlockRef ] = useState();
	const [ error, setError ] = useState( null );
	const [ latexToMathML, setLatexToMathML ] = useState();

	useEffect( () => {
		import( '@wordpress/latex-to-mathml' ).then( ( module ) => {
			setLatexToMathML( () => module.default );
		} );
	}, [] );

	const blockProps = useBlockProps( {
		ref: setBlockRef,
		position: 'relative',
	} );

	return (
		<>
			<div
				{ ...blockProps }
				{ ...( attributes.mathML
					? {
							dangerouslySetInnerHTML: {
								__html:
									// It seems React doesn't currently support
									// rendering <math> elements directly.
									'<math display="block">' +
									attributes.mathML +
									'</math>',
							},
					  }
					: { children: attributes.latex || '\u200B' } ) }
			/>
			{ isSelected && (
				<Popover
					placement="bottom-start"
					offset={ 8 }
					anchor={ blockRef }
					focusOnMount="firstContentElement"
				>
					<div style={ { padding: '4px', minWidth: '300px' } }>
						<VStack spacing={ 1 }>
							<TextareaControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'LaTeX math syntax' ) }
								hideLabelFromVision
								value={ latex }
								onChange={ ( newLatex ) => {
									setAttributes( { latex: newLatex } );
									if ( ! latexToMathML ) {
										return;
									}
									let mathML = '';
									try {
										mathML = latexToMathML( newLatex, {
											displayMode: true,
										} );
										setError( null );
									} catch ( err ) {
										setError( err.message );
									}
									setAttributes( { mathML } );
								} }
								placeholder={ __( 'e.g., x^2, \\frac{a}{b}' ) }
							/>
							{ error && (
								<>
									<Badge
										intent="error"
										className="wp-block-math__error"
									>
										{ error }
									</Badge>
									<style children=".wp-block-math__error .components-badge__content{white-space:normal}" />
								</>
							) }
						</VStack>
					</div>
				</Popover>
			) }
		</>
	);
}
