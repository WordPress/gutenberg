/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	TextareaControl,
	Popover,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { Badge } = unlock( componentsPrivateApis );

export default function MathEdit( { attributes, setAttributes, isSelected } ) {
	const { latex, mathML } = attributes;
	const [ blockRef, setBlockRef ] = useState();
	const [ error, setError ] = useState( null );
	const [ latexToMathML, setLatexToMathML ] = useState();
	const initialLatex = useRef( latex );
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	useEffect( () => {
		import( '@wordpress/latex-to-mathml' ).then( ( module ) => {
			setLatexToMathML( () => module.default );
			if ( initialLatex.current ) {
				__unstableMarkNextChangeAsNotPersistent();
				setAttributes( {
					mathML: module.default( initialLatex.current, {
						displayMode: true,
					} ),
				} );
			}
		} );
	}, [
		initialLatex,
		setAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	const blockProps = useBlockProps( {
		ref: setBlockRef,
		position: 'relative',
	} );

	return (
		<div { ...blockProps }>
			{ mathML ? (
				<math
					// We can't spread block props on the math element because
					// it only supports a limited amount of global attributes.
					// For example, draggable will have no effect.
					display="block"
					dangerouslySetInnerHTML={ { __html: mathML } }
				/>
			) : (
				'\u200B'
			) }
			{ isSelected && (
				<Popover
					placement="bottom-start"
					offset={ 8 }
					anchor={ blockRef }
					focusOnMount={ false }
					__unstableSlotName="__unstable-block-tools-after"
				>
					<div style={ { padding: '4px', minWidth: '300px' } }>
						<VStack spacing={ 1 }>
							<TextareaControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'LaTeX math syntax' ) }
								hideLabelFromVision
								value={ latex }
								className="wp-block-math__textarea-control"
								onChange={ ( newLatex ) => {
									if ( ! latexToMathML ) {
										setAttributes( { latex: newLatex } );
										return;
									}
									let newMathML = '';
									try {
										newMathML = latexToMathML( newLatex, {
											displayMode: true,
										} );
										setError( null );
									} catch ( err ) {
										setError( err.message );
										speak( err.message );
									}
									setAttributes( {
										mathML: newMathML,
										latex: newLatex,
									} );
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
		</div>
	);
}
