import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Popover } from '@wordpress/components';
import { ValidatedTextareaControl, Link } from '@wordpress/ui';
import { useState, useEffect, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { useEvent } from '@wordpress/compose';

export default function MathEdit( { attributes, setAttributes, isSelected } ) {
	const { latex, mathML } = attributes;
	const [ blockRef, setBlockRef ] = useState();
	const [ error, setError ] = useState( null );
	const [ latexToMathML, setLatexToMathML ] = useState();
	const formRef = useRef();
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	// Re-render once the converter loads, so MathML saved from a corrupted
	// source is repaired and a source typed before the converter loaded is
	// rendered. The converter loads asynchronously, and the user can type in
	// the meantime, so read the source at that time rather than on mount.
	const renderLatest = useEvent( ( convert ) => {
		if ( ! latex ) {
			return;
		}
		try {
			const newMathML = convert( latex, { displayMode: true } );
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { mathML: newMathML } );
		} catch ( err ) {
			setError( err.message );
		}
	} );

	useEffect( () => {
		import( '@wordpress/latex-to-mathml' ).then( ( module ) => {
			setLatexToMathML( () => module.default );
			renderLatest( module.default );
		} );
	}, [ renderLatest ] );

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
				// Show the source until it renders, as the front end does.
				<math display="block">
					<semantics>
						{ /* eslint-disable-next-line react/no-unknown-property -- MathML attribute. */ }
						<annotation encoding="application/x-tex">
							{ latex || '\u200B' }
						</annotation>
					</semantics>
				</math>
			) }
			{ isSelected && (
				<Popover
					placement="bottom-start"
					offset={ 8 }
					anchor={ blockRef }
					focusOnMount={ false }
					// Surface any parsing error before focus leaves the block.
					// An invalid field is refocused, keeping the popover open.
					onFocusOutside={ () => formRef.current?.reportValidity() }
					__unstableSlotName="__unstable-block-tools-after"
				>
					<form
						ref={ formRef }
						style={ { padding: '16px', minWidth: '300px' } }
						onSubmit={ ( event ) => event.preventDefault() }
					>
						<ValidatedTextareaControl
							label={ __( 'LaTeX math syntax' ) }
							value={ latex ?? '' }
							className="wp-block-math__textarea-control"
							customValidity={
								error
									? { type: 'invalid', message: error }
									: undefined
							}
							onValueChange={ ( newLatex ) => {
								if ( ! latexToMathML ) {
									// The source is read back from the MathML,
									// so clear a stale render along with it.
									setAttributes( {
										latex: newLatex,
										mathML: '',
									} );
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
								}
								setAttributes( {
									mathML: newMathML,
									latex: newLatex,
								} );
							} }
							placeholder={ __(
								'e.g., x^2, \\frac{a}{b}, \\sqrt{x}'
							) }
						/>
						<Link
							openInNewTab
							className="wp-block-math__learn-more"
							href={ __(
								'https://wordpress.org/documentation/article/math-block/'
							) }
						>
							{ __( 'Learn more about LaTeX syntax' ) }
						</Link>
					</form>
				</Popover>
			) }
		</div>
	);
}
