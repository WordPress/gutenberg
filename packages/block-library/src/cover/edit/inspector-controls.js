/**
 * WordPress dependencies
 */
import { Fragment, useMemo } from '@wordpress/element';
import {
	Button,
	ExternalLink,
	FocalPointPicker,
	PanelBody,
	PanelRow,
	RangeControl,
	TextareaControl,
	ToggleControl,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalUnitControl as UnitControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import {
	InspectorControls,
	useSetting,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseGradient,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { COVER_MIN_HEIGHT, mediaPosition } from '../shared';

function CoverHeightInput( {
	onChange,
	onUnitChange,
	unit = 'px',
	value = '',
} ) {
	const instanceId = useInstanceId( UnitControl );
	const inputId = `block-cover-height-input-${ instanceId }`;
	const isPx = unit === 'px';

	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [
			'px',
			'em',
			'rem',
			'vw',
			'vh',
		],
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
			__unstableInputWidth={ '80px' }
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
	} = attributes;
	const {
		isVideoBackground,
		isImageBackground,
		mediaElement,
		url,
		isImgElement,
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

	return (
		<>
			<InspectorControls>
				{ !! url && (
					<PanelBody title={ __( 'Media settings' ) }>
						{ isImageBackground && (
							<Fragment>
								<ToggleControl
									label={ __( 'Fixed background' ) }
									checked={ hasParallax }
									onChange={ toggleParallax }
								/>

								<ToggleControl
									label={ __( 'Repeated background' ) }
									checked={ isRepeated }
									onChange={ toggleIsRepeated }
								/>
							</Fragment>
						) }
						{ showFocalPointPicker && (
							<FocalPointPicker
								label={ __( 'Focal point picker' ) }
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
						{ ! useFeaturedImage &&
							url &&
							isImageBackground &&
							isImgElement && (
								<TextareaControl
									label={ __(
										'Alt text (alternative text)'
									) }
									value={ alt }
									onChange={ ( newAlt ) =>
										setAttributes( { alt: newAlt } )
									}
									help={
										<>
											<ExternalLink href="https://www.w3.org/WAI/tutorials/images/decision-tree">
												{ __(
													'Describe the purpose of the image'
												) }
											</ExternalLink>
											{ __(
												'Leave empty if the image is purely decorative.'
											) }
										</>
									}
								/>
							) }
						<PanelRow>
							<Button
								variant="secondary"
								isSmall
								className="block-library-cover__reset-button"
								onClick={ () =>
									setAttributes( {
										url: undefined,
										id: undefined,
										backgroundType: undefined,
										focalPoint: undefined,
										hasParallax: undefined,
										isRepeated: undefined,
										useFeaturedImage: false,
									} )
								}
							>
								{ __( 'Clear Media' ) }
							</Button>
						</PanelRow>
					</PanelBody>
				) }
			</InspectorControls>
			<InspectorControls __experimentalGroup="color">
				<ColorGradientSettingsDropdown
					__experimentalHasMultipleOrigins
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
					onDeselect={ () =>
						setAttributes( { dimRatio: url ? 50 : 100 } )
					}
					resetAllFilter={ () => ( {
						dimRatio: url ? 50 : 100,
					} ) }
					isShownByDefault
					panelId={ clientId }
				>
					<RangeControl
						label={ __( 'Overlay opacity' ) }
						value={ dimRatio }
						onChange={ ( newDimRation ) =>
							setAttributes( {
								dimRatio: newDimRation,
							} )
						}
						min={ 0 }
						max={ 100 }
						step={ 10 }
						required
					/>
				</ToolsPanelItem>
			</InspectorControls>
			<InspectorControls __experimentalGroup="dimensions">
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
					isShownByDefault={ true }
					panelId={ clientId }
				>
					<CoverHeightInput
						value={ minHeight }
						unit={ minHeightUnit }
						onChange={ ( newMinHeight ) =>
							setAttributes( { minHeight: newMinHeight } )
						}
						onUnitChange={ ( nextUnit ) =>
							setAttributes( {
								minHeightUnit: nextUnit,
							} )
						}
					/>
				</ToolsPanelItem>
			</InspectorControls>
		</>
	);
}
