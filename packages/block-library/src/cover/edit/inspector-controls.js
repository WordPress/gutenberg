/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import {
	FocalPointPicker,
	RangeControl,
	TextareaControl,
	ToggleControl,
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
import { Link } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { COVER_MIN_HEIGHT, mediaPosition } from '../shared';
import { unlock } from '../../lock-unlock';
import { useToolsPanelDropdownMenuProps } from '../../utils/hooks';
import {
	getActiveDimensionValue,
	getDimensionResetAttributes,
	getDimensionUpdateAttributes,
	getStyleStateKey,
} from '../../utils/style-state';
import { DEFAULT_MEDIA_SIZE_SLUG } from '../constants';
import PosterImage from '../../utils/poster-image';

const {
	cleanEmptyObject,
	isDefaultBlockStyleState,
	ResolutionTool,
	HTMLElementControl,
} = unlock( blockEditorPrivateApis );

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
	featuredImage,
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
		poster,
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
	const { imageSizes, selectedStyleState } = useSelect(
		( select ) => {
			const { getSettings, getSelectedBlockStyleState } = unlock(
				select( blockEditorStore )
			);

			return {
				imageSizes: getSettings()?.imageSizes,
				selectedStyleState: getSelectedBlockStyleState( clientId ),
			};
		},
		[ clientId ]
	);
	const hasSelectedStyleState =
		! isDefaultBlockStyleState( selectedStyleState );
	const selectedStyleStateKey = getStyleStateKey( selectedStyleState );
	const stateMinHeight = getActiveDimensionValue( {
		attributes,
		selectedState: selectedStyleState,
		hasSelectedStyleState,
		attributeKey: 'minHeight',
		styleKey: 'minHeight',
		rootValue: undefined,
	} );
	const [ stateMinHeightValue, stateMinHeightUnit ] =
		parseQuantityAndUnitFromRawValue( stateMinHeight || '' );
	const activeMinHeight = hasSelectedStyleState
		? stateMinHeightValue
		: minHeight;
	const activeMinHeightUnit = hasSelectedStyleState
		? stateMinHeightUnit || minHeightUnit
		: minHeightUnit;
	const activeAspectRatio = getActiveDimensionValue( {
		attributes,
		selectedState: selectedStyleState,
		hasSelectedStyleState,
		attributeKey: 'aspectRatio',
		rootValue: attributes?.style?.dimensions?.aspectRatio,
	} );

	const image = useSelect(
		( select ) =>
			id && isImageBackground
				? select( coreStore ).getEntityRecord(
						'postType',
						'attachment',
						id,
						{ context: 'view' }
				  )
				: null,
		[ id, isImageBackground ]
	);

	const currentBackgroundImage = useFeaturedImage ? featuredImage : image;

	function updateImage( newSizeSlug ) {
		const newUrl =
			currentBackgroundImage?.media_details?.sizes?.[ newSizeSlug ]
				?.source_url;
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
			( { slug } ) =>
				currentBackgroundImage?.media_details?.sizes?.[ slug ]
					?.source_url
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

	const showFocalPointPicker = isVideoBackground || isImageBackground;

	const imperativeFocalPointPreview = ( value ) => {
		const [ styleOfRef, property ] = mediaElement.current
			? [ mediaElement.current.style, 'objectPosition' ]
			: [ coverRef.current.style, 'backgroundPosition' ];
		styleOfRef[ property ] = mediaPosition( value );
	};

	const colorGradientSettings = useMultipleOriginColorsAndGradients();

	const showOverlayControls =
		colorGradientSettings.hasColorsOrGradients && ! hasSelectedStyleState;

	const setMinHeightAttributes = ( nextMinHeight, nextUnit ) => {
		if ( hasSelectedStyleState ) {
			setAttributes(
				getDimensionUpdateAttributes( {
					style: attributes.style,
					selectedState: selectedStyleState,
					hasSelectedStyleState,
					nextDimensions: {
						minHeight:
							nextMinHeight === undefined
								? undefined
								: `${ nextMinHeight }${
										nextUnit || activeMinHeightUnit || 'px'
								  }`,
						aspectRatio: undefined,
					},
				} )
			);
			return;
		}

		setAttributes( {
			minHeight: nextMinHeight,
			style: cleanEmptyObject( {
				...attributes?.style,
				dimensions: {
					...attributes?.style?.dimensions,
					aspectRatio: undefined, // Reset aspect ratio when minHeight is set.
				},
			} ),
		} );
	};

	const getResetMinHeightAttributes = ( attrs = attributes ) => {
		return getDimensionResetAttributes( {
			style: attrs.style,
			selectedState: selectedStyleState,
			hasSelectedStyleState,
			keys: [ 'minHeight' ],
			defaultAttributes: {
				minHeight: undefined,
				minHeightUnit: undefined,
			},
		} );
	};

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<>
			{ ( !! url || useFeaturedImage ) && (
				<InspectorControls>
					<ToolsPanel
						label={ __( 'Settings' ) }
						resetAll={ () => {
							setAttributes( {
								hasParallax: false,
								focalPoint: undefined,
								isRepeated: false,
								alt: '',
								poster: undefined,
							} );
							updateImage( DEFAULT_MEDIA_SIZE_SLUG );
						} }
						dropdownMenuProps={ dropdownMenuProps }
					>
						{ isImageBackground && (
							<>
								<ToolsPanelItem
									label={ __( 'Fixed background' ) }
									isShownByDefault
									hasValue={ () => !! hasParallax }
									onDeselect={ () =>
										setAttributes( {
											hasParallax: false,
											focalPoint: undefined,
										} )
									}
								>
									<ToggleControl
										label={ __( 'Fixed background' ) }
										checked={ !! hasParallax }
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
						{ isVideoBackground && (
							<PosterImage
								poster={ poster }
								onChange={ ( posterImage ) =>
									setAttributes( {
										poster: posterImage?.url,
									} )
								}
							/>
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
									label={ __( 'Alternative text' ) }
									value={ alt }
									onChange={ ( newAlt ) =>
										setAttributes( { alt: newAlt } )
									}
									help={
										<>
											<Link
												openInNewTab
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
											</Link>
											<br />
											{ __(
												'Leave empty if decorative.'
											) }
										</>
									}
								/>
							</ToolsPanelItem>
						) }
						{ !! imageSizeOptions?.length && (
							<ResolutionTool
								value={ sizeSlug }
								onChange={ updateImage }
								options={ imageSizeOptions }
								defaultValue={ DEFAULT_MEDIA_SIZE_SLUG }
							/>
						) }
					</ToolsPanel>
				</InspectorControls>
			) }
			{ showOverlayControls && (
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
							label={ __( 'Overlay opacity' ) }
							value={ dimRatio }
							onChange={ ( newDimRatio ) =>
								updateDimRatio( newDimRatio )
							}
							min={ 0 }
							max={ 100 }
							step={ 10 }
							required
						/>
					</ToolsPanelItem>
				</InspectorControls>
			) }
			<InspectorControls group="dimensions">
				<ToolsPanelItem
					key={ selectedStyleStateKey }
					className="single-column"
					hasValue={ () => !! activeMinHeight }
					label={ __( 'Minimum height' ) }
					onDeselect={ () =>
						setAttributes( getResetMinHeightAttributes() )
					}
					resetAllFilter={ getResetMinHeightAttributes }
					isShownByDefault
					panelId={ clientId }
				>
					<CoverHeightInput
						value={ activeAspectRatio ? '' : activeMinHeight }
						unit={ activeMinHeightUnit }
						onChange={ ( newMinHeight ) =>
							setMinHeightAttributes( newMinHeight )
						}
						onUnitChange={ ( nextUnit ) => {
							if ( hasSelectedStyleState ) {
								if ( activeMinHeight !== undefined ) {
									setMinHeightAttributes(
										activeMinHeight,
										nextUnit
									);
								}
								return;
							}

							setAttributes( {
								minHeightUnit: nextUnit,
							} );
						} }
					/>
				</ToolsPanelItem>
			</InspectorControls>
			<InspectorControls group="advanced">
				<HTMLElementControl
					tagName={ tagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
					clientId={ clientId }
					options={ [
						{ label: __( 'Default (<div>)' ), value: 'div' },
						{ label: '<header>', value: 'header' },
						{ label: '<main>', value: 'main' },
						{ label: '<section>', value: 'section' },
						{ label: '<article>', value: 'article' },
						{ label: '<aside>', value: 'aside' },
						{ label: '<footer>', value: 'footer' },
					] }
				/>
			</InspectorControls>
		</>
	);
}
