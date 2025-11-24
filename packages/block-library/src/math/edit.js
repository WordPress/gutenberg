/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	store as blockEditorStore,
	InspectorControls,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
} from '@wordpress/block-editor';
import {
	TextareaControl,
	PanelBody,
	RangeControl,
	__experimentalBorderControl as BorderControl,
	__experimentalUnitControl as UnitControl,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { Badge } = unlock( componentsPrivateApis );

export default function MathEdit( { attributes, setAttributes, isSelected } ) {
	const {
		latex,
		mathML,
		fontSize,
		textColor,
		backgroundColor,
		border,
		borderRadius,
		padding,
	} = attributes;
	const [ error, setError ] = useState( null );
	const [ latexToMathML, setLatexToMathML ] = useState();
	const [ isEditing, setIsEditing ] = useState( ! latex );
	const initialLatex = useRef( latex );
	const textareaRef = useRef( null );
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const colorGradientSettings = useMultipleOriginColorsAndGradients();

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

	// Enter edit mode when block is selected and empty
	useEffect( () => {
		if ( isSelected && ! latex ) {
			setIsEditing( true );
		}
	}, [ isSelected, latex ] );

	// Focus textarea when entering edit mode
	useEffect( () => {
		if ( isEditing && textareaRef.current ) {
			textareaRef.current.focus();
		}
	}, [ isEditing ] );

	const handleLatexChange = ( newLatex ) => {
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
		}
		setAttributes( {
			mathML: newMathML,
			latex: newLatex,
		} );
	};

	const handleBlur = () => {
		// Only exit edit mode if there's content or if block is not selected
		if ( latex || ! isSelected ) {
			setIsEditing( false );
		}
	};

	const handlePreviewClick = () => {
		if ( isSelected ) {
			setIsEditing( true );
		}
	};

	// Build inline styles for the math container
	const mathContainerStyle = {
		fontSize: fontSize ? `${ fontSize }px` : undefined,
		color: textColor,
		backgroundColor,
		borderWidth: border?.width,
		borderStyle: border?.style || ( border?.width ? 'solid' : undefined ),
		borderColor: border?.color,
		borderRadius,
		padding: padding || ( backgroundColor || border?.width ? '16px' : undefined ),
		minHeight: '40px',
		cursor: isSelected && ! isEditing ? 'text' : 'default',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	};

	const blockProps = useBlockProps( {
		className: isEditing ? 'is-editing' : '',
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Appearance' ) } initialOpen>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Font size' ) }
						value={ fontSize || 16 }
						onChange={ ( value ) =>
							setAttributes( { fontSize: value } )
						}
						min={ 12 }
						max={ 120 }
						step={ 1 }
						help={ __( 'Adjust the size of the mathematical expression' ) }
					/>
					<UnitControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Padding' ) }
						value={ padding || '0px' }
						onChange={ ( value ) =>
							setAttributes( { padding: value } )
						}
						units={ [
							{ value: 'px', label: 'px' },
							{ value: 'em', label: 'em' },
							{ value: 'rem', label: 'rem' },
						] }
					/>
					<div style={ { marginBottom: '16px' } }>
						<BorderControl
							__next40pxDefaultSize
							label={ __( 'Border' ) }
							value={ border }
							onChange={ ( value ) =>
								setAttributes( { border: value } )
							}
						/>
					</div>
					<UnitControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Border radius' ) }
						value={ borderRadius || '0px' }
						onChange={ ( value ) =>
							setAttributes( { borderRadius: value } )
						}
						units={ [
							{ value: 'px', label: 'px' },
							{ value: '%', label: '%' },
							{ value: 'em', label: 'em' },
						] }
					/>
				</PanelBody>
			</InspectorControls>
			<InspectorControls group="color">
				<ColorGradientSettingsDropdown
					__experimentalIsRenderedInSidebar
					settings={ [
						{
							label: __( 'Text' ),
							colorValue: textColor,
							onColorChange: ( value ) =>
								setAttributes( { textColor: value } ),
						},
						{
							label: __( 'Background' ),
							colorValue: backgroundColor,
							onColorChange: ( value ) =>
								setAttributes( { backgroundColor: value } ),
						},
					] }
					panelId="math-color-settings"
					{ ...colorGradientSettings }
				/>
			</InspectorControls>
			<div { ...blockProps }>
				{ isEditing ? (
					<VStack spacing={ 1 }>
						<TextareaControl
							ref={ textareaRef }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'LaTeX math syntax' ) }
							hideLabelFromVision
							value={ latex }
							className="wp-block-math__textarea-control"
							onChange={ handleLatexChange }
							onBlur={ handleBlur }
							placeholder={ __( 'e.g., x^2, \\frac{a}{b}' ) }
							rows={ 3 }
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
				) : (
					<div
						onClick={ handlePreviewClick }
						role="button"
						tabIndex={ 0 }
						onKeyDown={ ( e ) => {
							if ( e.key === 'Enter' || e.key === ' ' ) {
								handlePreviewClick();
							}
						} }
						style={ mathContainerStyle }
					>
						{ mathML ? (
							<math
								display="block"
								dangerouslySetInnerHTML={ { __html: mathML } }
							/>
						) : (
							'\u200B'
						) }
					</div>
				) }
			</div>
		</>
	);
}
