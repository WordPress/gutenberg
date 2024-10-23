/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import {
	ExternalLink,
	FocalPointPicker,
	RangeControl,
	TextareaControl,
	ToggleControl,
	SelectControl,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalUnitControl as UnitControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import {
	InspectorControls,
	useSettings,
	store as blockEditorStore,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseGradient,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { COVER_MIN_HEIGHT, mediaPosition } from '../shared';
import { unlock } from '../../lock-unlock';
import { useToolsPanelDropdownMenuProps } from '../../utils/hooks';
import { DEFAULT_MEDIA_SIZE_SLUG } from '../constants';

const { cleanEmptyObject, ResolutionTool } = unlock( blockEditorPrivateApis );

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
			__next40pxDefaultSize
			label={ __( 'Minimum height' ) }
			id={ inputId }
			isResetValueOnUnitChange
			min={ min }
			onChange={ handleOnChange }
			onUnitChange={ onUnitChange }
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
} ) {
	const {
		useFeaturedImage,
		id,
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

	const sizeSlug = attributes.sizeSlug || DEFAULT_MEDIA_SIZE_SLUG;

	const { gradientValue, setGradient } = __experimentalUseGradient();
	const { getSettings } = useSelect( blockEditorStore );

	const imageSizes = getSettings()?.imageSizes;

	const image = useSelect(
		( select ) =>
			id && isImageBackground
				? select( coreStore ).getMedia( id, { context: 'view' } )
				: null,
		[ id, isImageBackground ]
	);

	function updateImage( newSizeSlug ) {
		const newUrl = image?.media_details?.sizes?.[ newSizeSlug ]?.source_url;
		if ( ! newUrl ) {
			return null;
		}

		setAttributes( {
			url: newUrl,
			sizeSlug: newSizeSlug,
		} );
	}

	const imageSizeOptions = imageSizes
		?.filter(
			( { slug } ) => image?.media_details?.sizes?.[ slug ]?.source_url
		)
		?.map( ( { name, slug } ) => ( { value: slug, label: name } ) );

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

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<>
			<InspectorControls>
				{ !! url && (
					<ToolsPanel
						label={ __( 'Settings' ) }
						resetAll={ () => {
							setAttributes( {
								hasParallax: false,
								focalPoint: undefined,
								isRepeated: false,
								alt: '',
								sizeSlug: undefined,
							} );
						} }
						dropdownMenuProps={ dropdownMenuProps }
					>
						{ isImageBackground && (
							<>
								<ToolsPanelItem
									label={ __( 'Fixed background' ) }
									isShownByDefault
									hasValue={ () => hasParallax }
									onDeselect={ () =>
										setAttributes( {
											hasParallax: false,
											focalPoint: undefined,
										} )
									}
								>
									<ToggleControl
										__nextHasNoMarginBottom
										label={ __( 'Fixed background' ) }
										checked={ hasParallax }
										onChange={ toggleParallax }
									/>
								</ToolsPanelItem>

								<ToolsPanelItem
									label={ __( 'Repeated background' ) }
									isShownByDefault
									hasValue={ () => isRepeated }
									onDeselect={ () =>
										setAttributes( {
											isRepeated: false,
										} )
									}
								>
									<ToggleControl
										__nextHasNoMarginBottom
										label={ __( 'Repeated background' ) }
										checked={ isRepeated }
										onChange={ toggleIsRepeated }
									/>
								</ToolsPanelItem>
							</>
						) }
						{ showFocalPointPicker && (
							<ToolsPanelItem
								label={ __( 'Focal point' ) }
								isShownByDefault
								hasValue={ () => !! focalPoint }
								onDeselect={ () =>
									setAttributes( {
										focalPoint: undefined,
									} )
								}
							>
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
							</ToolsPanelItem>
						) }
						{ ! useFeaturedImage && url && ! isVideoBackground && (
							<ToolsPanelItem
								label={ __( 'Alternative text' ) }
								isShownByDefault
								hasValue={ () => !! alt }
								onDeselect={ () =>
									setAttributes( { alt: '' } )
								}
							>
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
											{ __(
												'Leave empty if decorative.'
											) }
										</>
									}
								/>
							</ToolsPanelItem>
						) }
						{ ! useFeaturedImage && !! imageSizeOptions?.length && (
							<ResolutionTool
								value={ sizeSlug }
								onChange={ updateImage }
								options={ imageSizeOptions }
								defaultValue={ DEFAULT_MEDIA_SIZE_SLUG }
							/>
						) }
					</ToolsPanel>
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
					className="single-column"
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
