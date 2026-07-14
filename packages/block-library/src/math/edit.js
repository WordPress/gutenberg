/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
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
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { Badge: WCBadge } = unlock( componentsPrivateApis );

export default function MathEdit( { attributes, setAttributes, isSelected } ) {
	const { latex, mathML } = attributes;
	const [ blockRef, setBlockRef ] = useState();
	const [ error, setError ] = useState( null );
	const [ latexToMathML, setLatexToMathML ] = useState();
	// Tracks the latest `latex` so the one-shot effect below can read it
	// when the dynamic import resolves rather than the value captured at
	// mount.
	const latestLatexRef = useRef( latex );
	useEffect( () => {
		latestLatexRef.current = latex;
	} );
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	useEffect( () => {
		import( '@wordpress/latex-to-mathml' ).then( ( module ) => {
			setLatexToMathML( () => module.default );
			const currentLatex = latestLatexRef.current;
			if ( currentLatex ) {
				// `wp_kses` runs on block attributes for users without
				// `unfiltered_html`, encoding `&` to `&amp;`. LaTeX uses
				// `&` (e.g. as a column separator in `pmatrix`), so decode
				// entities before rendering.
				const decodedLatex = decodeEntities( currentLatex );
				__unstableMarkNextChangeAsNotPersistent();
				setAttributes( {
					mathML: module.default( decodedLatex, {
						displayMode: true,
					} ),
					...( decodedLatex !== currentLatex && {
						latex: decodedLatex,
					} ),
				} );
			}
		} );
	}, [ setAttributes, __unstableMarkNextChangeAsNotPersistent ] );

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
										speak(
											sprintf(
												/* translators: %s: error message returned when parsing LaTeX. */
												__(
													'Error parsing mathematical expression: %s'
												),
												err.message
											)
										);
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
						</VStack>
					</div>
				</Popover>
			) }
		</div>
	);
}
