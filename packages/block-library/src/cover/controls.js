/**
 * WordPress dependencies
 */
import { Fragment, useState, useMemo } from '@wordpress/element';
import {
	BaseControl,
	Button,
	ExternalLink,
	FocalPointPicker,
	PanelBody,
	PanelRow,
	RangeControl,
	TextareaControl,
	ToggleControl,
	ToolbarButton,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalUnitControl as UnitControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import {
	BlockControls,
	InspectorControls,
	MediaReplaceFlow,
	useSetting,
	__experimentalUseGradient,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
	__experimentalBlockAlignmentMatrixControl as BlockAlignmentMatrixControl,
	__experimentalBlockFullHeightAligmentControl as FullHeightAlignmentControl,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { postFeaturedImage } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ALLOWED_MEDIA_TYPES, COVER_MIN_HEIGHT, mediaPosition } from './shared';

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
		<BaseControl label={ __( 'Minimum height of cover' ) } id={ inputId }>
			<UnitControl
				id={ inputId }
				isResetValueOnUnitChange
				min={ min }
				onChange={ handleOnChange }
				onUnitChange={ onUnitChange }
				style={ { maxWidth: 80 } }
				units={ units }
				value={ computedValue }
			/>
		</BaseControl>
	);
}

export default function Controls( {
	attributes,
	setAttributes,
	clientId,
	setOverlayColor,
	ref,
	onSelectMedia,
	currentSettings,
} ) {
	const {
		contentPosition,
		id,
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
		isDarkElement,
		hasInnerBlocks,
		url,
		isImgElement,
		overlayColor,
	} = currentSettings;

	const [ prevMinHeightValue, setPrevMinHeightValue ] = useState( minHeight );
	const [ prevMinHeightUnit, setPrevMinHeightUnit ] = useState(
		minHeightUnit
	);

	const { gradientValue, setGradient } = __experimentalUseGradient();
	const isMinFullHeight = minHeightUnit === 'vh' && minHeight === 100;
	const toggleMinFullHeight = () => {
		if ( isMinFullHeight ) {
			// If there aren't previous values, take the default ones.
			if ( prevMinHeightUnit === 'vh' && prevMinHeightValue === 100 ) {
				return setAttributes( {
					minHeight: undefined,
					minHeightUnit: undefined,
				} );
			}

			// Set the previous values of height.
			return setAttributes( {
				minHeight: prevMinHeightValue,
				minHeightUnit: prevMinHeightUnit,
			} );
		}

		setPrevMinHeightValue( minHeight );
		setPrevMinHeightUnit( minHeightUnit );

		// Set full height.
		return setAttributes( {
			minHeight: 100,
			minHeightUnit: 'vh',
		} );
	};

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

	const toggleUseFeaturedImage = () => {
		setAttributes( {
			useFeaturedImage: ! useFeaturedImage,
			dimRatio: dimRatio === 100 ? 50 : dimRatio,
		} );
	};

	const showFocalPointPicker =
		isVideoBackground ||
		( isImageBackground && ( ! hasParallax || isRepeated ) );

	const imperativeFocalPointPreview = ( value ) => {
		const [ styleOfRef, property ] = isDarkElement.current
			? [ isDarkElement.current.style, 'objectPosition' ]
			: [ ref.current.style, 'backgroundPosition' ];
		styleOfRef[ property ] = mediaPosition( value );
	};
	return (
		<>
			<BlockControls group="block">
				<BlockAlignmentMatrixControl
					label={ __( 'Change content position' ) }
					value={ contentPosition }
					onChange={ ( nextPosition ) =>
						setAttributes( {
							contentPosition: nextPosition,
						} )
					}
					isDisabled={ ! hasInnerBlocks }
				/>
				<FullHeightAlignmentControl
					isActive={ isMinFullHeight }
					onToggle={ toggleMinFullHeight }
					isDisabled={ ! hasInnerBlocks }
				/>
			</BlockControls>
			<BlockControls group="other">
				<ToolbarButton
					icon={ postFeaturedImage }
					label={ __( 'Use featured image' ) }
					isPressed={ useFeaturedImage }
					onClick={ toggleUseFeaturedImage }
				/>
				{ ! useFeaturedImage && (
					<MediaReplaceFlow
						mediaId={ id }
						mediaURL={ url }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						accept="image/*,video/*"
						onSelect={ onSelectMedia }
						name={ ! url ? __( 'Add Media' ) : __( 'Replace' ) }
					/>
				) }
			</BlockControls>
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
				<PanelColorGradientSettings
					__experimentalHasMultipleOrigins
					__experimentalIsRenderedInSidebar
					title={ __( 'Overlay' ) }
					initialOpen={ true }
					settings={ [
						{
							colorValue: overlayColor.color,
							gradientValue,
							onColorChange: setOverlayColor,
							onGradientChange: setGradient,
							label: __( 'Color' ),
						},
					] }
				>
					<RangeControl
						label={ __( 'Opacity' ) }
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
				</PanelColorGradientSettings>
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
