/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import {
	Button,
	ExternalLink,
	FocalPointPicker,
	PanelBody,
	PanelRow,
	RangeControl,
	TextareaControl,
	ToggleControl,
	SelectControl,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalUnitControl as UnitControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import {
	InspectorControls,
	useSettings,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseGradient,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { COVER_MIN_HEIGHT, mediaPosition } from '../shared';
import { unlock } from '../../lock-unlock';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

function CoverHeightInput( {
	onChange,
	onUnitChange,
	unit = 'px',
	value = '',
} ) {
	const instanceId = useInstanceId( UnitControl );
	const inputId = `block-cover-height-input-${ instanceId }`;
	const isPx = unit === 'px';

	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		availableUnits: availableUnits || [ 'px', 'em', 'rem', 'vw', 'vh' ],
		defaultValues: { px: 430, '%': 20, em: 20, rem: 20, vw: 20, vh: 50 },
	} );

	const handleOnChange = ( unprocessedValue ) => {
		const inputValue =
			unprocessedValue !== ''
				? parseFloat( unprocessedValue )
				: undefined;

		if ( isNaN( inputValue ) && inputValue !== undefined ) {
			return;
		}
		onChange( inputValue );
	};

	const computedValue = useMemo( () => {
		const [ parsedQuantity ] = parseQuantityAndUnitFromRawValue( value );
		return [ parsedQuantity, unit ].join( '' );
	}, [ unit, value ] );

	const min = isPx ? COVER_MIN_HEIGHT : 0;

	return (
		<UnitControl
			label={ __( 'Minimum height of cover' ) }
			id={ inputId }
			isResetValueOnUnitChange
			min={ min }
			onChange={ handleOnChange }
			onUnitChange={ onUnitChange }
			__unstableInputWidth="80px"
			units={ units }
			value={ computedValue }
		/>
	);
}
export default function CoverInspectorControls( {
	attributes,
	setAttributes,
	clientId,
	setOverlayColor,
	coverRef,
	currentSettings,
	updateDimRatio,
	onClearMedia,
} ) {
	const {
		useFeaturedImage,
		dimRatio,
		focalPoint,
		hasParallax,
		isRepeated,
		minHeight,
		minHeightUnit,
		alt,
		tagName,
	} = attributes;
	const {
		isVideoBackground,
		isImageBackground,
		mediaElement,
		url,
		overlayColor,
	} = currentSettings;

	const { gradientValue, setGradient } = __experimentalUseGradient();

	const toggleParallax = () => {
		setAttributes( {
			hasParallax: ! hasParallax,
			...( ! hasParallax ? { focalPoint: undefined } : {} ),
		} );
	};

	const toggleIsRepeated = () => {
		setAttributes( {
			isRepeated: ! isRepeated,
		} );
	};

	const showFocalPointPicker =
		isVideoBackground ||
		( isImageBackground && ( ! hasParallax || isRepeated ) );

	const imperativeFocalPointPreview = ( value ) => {
		const [ styleOfRef, property ] = mediaElement.current
			? [ mediaElement.current.style, 'objectPosition' ]
			: [ coverRef.current.style, 'backgroundPosition' ];
		styleOfRef[ property ] = mediaPosition( value );
	};

	const colorGradientSettings = useMultipleOriginColorsAndGradients();

	const htmlElementMessages = {
		header: __(
			'The <header> element should represent introductory content, typically a group of introductory or navigational aids.'
		),
		main: __(
			'The <main> element should be used for the primary content of your document only.'
		),
		section: __(
			"The <section> element should represent a standalone portion of the document that can't be better represented by another element."
		),
		article: __(
			'The <article> element should represent a self-contained, syndicatable portion of the document.'
		),
		aside: __(
			"The <aside> element should represent a portion of a document whose content is only indirectly related to the document's main content."
		),
		footer: __(
			'The <footer> element should represent a footer for its nearest sectioning element (e.g.: <section>, <article>, <main> etc.).'
		),
	};

	return (
		<>
			<InspectorControls>
				{ !! url && (
					<PanelBody title={ __( 'Settings' ) }>
						{ isImageBackground && (
							<>
								<ToggleControl
									__nextHasNoMarginBottom
									label={ __( 'Fixed background' ) }
									checked={ hasParallax }
									onChange={ toggleParallax }
								/>

								<ToggleControl
									__nextHasNoMarginBottom
									label={ __( 'Repeated background' ) }
									checked={ isRepeated }
									onChange={ toggleIsRepeated }
								/>
							</>
						) }
						{ showFocalPointPicker && (
							<FocalPointPicker
								__nextHasNoMarginBottom
								label={ __( 'Focal point' ) }
								url={ url }
								value={ focalPoint }
								onDragStart={ imperativeFocalPointPreview }
								onDrag={ imperativeFocalPointPreview }
								onChange={ ( newFocalPoint ) =>
									setAttributes( {
										focalPoint: newFocalPoint,
									} )
								}
							/>
						) }
						{ ! useFeaturedImage && url && ! isVideoBackground && (
							<TextareaControl
								__nextHasNoMarginBottom
								label={ __( 'Alternative text' ) }
								value={ alt }
								onChange={ ( newAlt ) =>
									setAttributes( { alt: newAlt } )
								}
								help={
									<>
										<ExternalLink
											href={
												// translators: Localized tutorial, if one exists. W3C Web Accessibility Initiative link has list of existing translations.
												__(
													'https://www.w3.org/WAI/tutorials/images/decision-tree/'
												)
											}
										>
											{ __(
												'Describe the purpose of the image.'
											) }
										</ExternalLink>
										<br />
										{ __( 'Leave empty if decorative.' ) }
									</>
								}
							/>
						) }
						<PanelRow>
							<Button
								variant="secondary"
								size="small"
								className="block-library-cover__reset-button"
								onClick={ onClearMedia }
							>
								{ __( 'Clear Media' ) }
							</Button>
						</PanelRow>
					</PanelBody>
				) }
			</InspectorControls>
			{ colorGradientSettings.hasColorsOrGradients && (
				<InspectorControls group="color">
					<ColorGradientSettingsDropdown
						__experimentalIsRenderedInSidebar
						settings={ [
							{
								colorValue: overlayColor.color,
								gradientValue,
								label: __( 'Overlay' ),
								onColorChange: setOverlayColor,
								onGradientChange: setGradient,
								isShownByDefault: true,
								resetAllFilter: () => ( {
									overlayColor: undefined,
									customOverlayColor: undefined,
									gradient: undefined,
									customGradient: undefined,
								} ),
								clearable: true,
							},
						] }
						panelId={ clientId }
						{ ...colorGradientSettings }
					/>
					<ToolsPanelItem
						hasValue={ () => {
							// If there's a media background the dimRatio will be
							// defaulted to 50 whereas it will be 100 for colors.
							return dimRatio === undefined
								? false
								: dimRatio !== ( url ? 50 : 100 );
						} }
						label={ __( 'Overlay opacity' ) }
						onDeselect={ () => updateDimRatio( url ? 50 : 100 ) }
						resetAllFilter={ () => ( {
							dimRatio: url ? 50 : 100,
						} ) }
						isShownByDefault
						panelId={ clientId }
					>
						<RangeControl
							__nextHasNoMarginBottom
							label={ __( 'Overlay opacity' ) }
							value={ dimRatio }
							onChange={ ( newDimRatio ) =>
								updateDimRatio( newDimRatio )
							}
							min={ 0 }
							max={ 100 }
							step={ 10 }
							required
							__next40pxDefaultSize
						/>
					</ToolsPanelItem>
				</InspectorControls>
			) }
			<InspectorControls group="dimensions">
				<ToolsPanelItem
					hasValue={ () => !! minHeight }
					label={ __( 'Minimum height' ) }
					onDeselect={ () =>
						setAttributes( {
							minHeight: undefined,
							minHeightUnit: undefined,
						} )
					}
					resetAllFilter={ () => ( {
						minHeight: undefined,
						minHeightUnit: undefined,
					} ) }
					isShownByDefault
					panelId={ clientId }
				>
					<CoverHeightInput
						value={
							attributes?.style?.dimensions?.aspectRatio
								? ''
								: minHeight
						}
						unit={ minHeightUnit }
						onChange={ ( newMinHeight ) =>
							setAttributes( {
								minHeight: newMinHeight,
								style: cleanEmptyObject( {
									...attributes?.style,
									dimensions: {
										...attributes?.style?.dimensions,
										aspectRatio: undefined, // Reset aspect ratio when minHeight is set.
									},
								} ),
							} )
						}
						onUnitChange={ ( nextUnit ) =>
							setAttributes( {
								minHeightUnit: nextUnit,
							} )
						}
					/>
				</ToolsPanelItem>
			</InspectorControls>
			<InspectorControls group="advanced">
				<SelectControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'HTML element' ) }
					options={ [
						{ label: __( 'Default (<div>)' ), value: 'div' },
						{ label: '<header>', value: 'header' },
						{ label: '<main>', value: 'main' },
						{ label: '<section>', value: 'section' },
						{ label: '<article>', value: 'article' },
						{ label: '<aside>', value: 'aside' },
						{ label: '<footer>', value: 'footer' },
					] }
					value={ tagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
					help={ htmlElementMessages[ tagName ] }
				/>
			</InspectorControls>
		</>
	);
}
