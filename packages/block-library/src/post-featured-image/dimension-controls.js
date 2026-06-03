/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	SelectControl,
	__experimentalUnitControl as UnitControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useSettings } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import {
	getStateDimensions,
	resetDimensions,
	resetStateDimensions,
	setStateDimensions,
} from '../utils/style-state';

const SCALE_OPTIONS = (
	<>
		<ToggleGroupControlOption
			value="cover"
			label={ _x( 'Cover', 'Scale option for Image dimension control' ) }
		/>
		<ToggleGroupControlOption
			value="contain"
			label={ _x(
				'Contain',
				'Scale option for Image dimension control'
			) }
		/>
		<ToggleGroupControlOption
			value="fill"
			label={ _x( 'Fill', 'Scale option for Image dimension control' ) }
		/>
	</>
);

const DEFAULT_SCALE = 'cover';

const hasDimensionValue = ( value ) =>
	value !== undefined && value !== null && value !== '';

const scaleHelp = {
	cover: __(
		'Image is scaled and cropped to fill the entire space without being distorted.'
	),
	contain: __(
		'Image is scaled to fill the space without clipping nor distorting.'
	),
	fill: __(
		'Image will be stretched and distorted to completely fill the space.'
	),
};

const DimensionControls = ( {
	clientId,
	attributes,
	setAttributes,
	selectedStyleState,
	hasSelectedStyleState = false,
} ) => {
	const { aspectRatio, width, height, scale, style } = attributes;
	const stateDimensions = hasSelectedStyleState
		? getStateDimensions( style, selectedStyleState )
		: {};
	const activeAspectRatio = hasSelectedStyleState
		? stateDimensions.aspectRatio
		: aspectRatio;
	const activeWidth = hasSelectedStyleState ? stateDimensions.width : width;
	const activeHeight = hasSelectedStyleState
		? stateDimensions.height
		: height;
	const activeScale = hasSelectedStyleState
		? stateDimensions.objectFit
		: scale;
	const displayScale = activeScale || DEFAULT_SCALE;
	const selectedStyleStateKey = [
		selectedStyleState?.viewport || 'default',
		selectedStyleState?.pseudo || 'default',
	].join( ':' );

	const [ availableUnits, defaultRatios, themeRatios, showDefaultRatios ] =
		useSettings(
			'spacing.units',
			'dimensions.aspectRatios.default',
			'dimensions.aspectRatios.theme',
			'dimensions.defaultAspectRatios'
		);
	const units = useCustomUnits( {
		availableUnits: availableUnits || [ 'px', '%', 'vw', 'em', 'rem' ],
	} );

	const setDimensionAttributes = ( nextDimensions ) => {
		const dimensions = { ...nextDimensions };
		const isSettingAspectRatio =
			Object.hasOwn( dimensions, 'aspectRatio' ) &&
			hasDimensionValue( dimensions.aspectRatio ) &&
			dimensions.aspectRatio !== 'auto';
		const isSettingHeight =
			Object.hasOwn( dimensions, 'height' ) &&
			hasDimensionValue( dimensions.height );

		if ( isSettingAspectRatio ) {
			dimensions.height = undefined;
		}
		if ( isSettingHeight ) {
			dimensions.aspectRatio = undefined;
		}

		if ( hasSelectedStyleState ) {
			const nextStateDimensions = {};
			if ( Object.hasOwn( dimensions, 'aspectRatio' ) ) {
				nextStateDimensions.aspectRatio = dimensions.aspectRatio;
			}
			if ( Object.hasOwn( dimensions, 'width' ) ) {
				nextStateDimensions.width = dimensions.width;
			}
			if ( Object.hasOwn( dimensions, 'height' ) ) {
				nextStateDimensions.height = dimensions.height;
			}
			if ( Object.hasOwn( dimensions, 'scale' ) ) {
				nextStateDimensions.objectFit = dimensions.scale;
			}

			setAttributes( {
				style: setStateDimensions( style, selectedStyleState, {
					...nextStateDimensions,
				} ),
			} );
			return;
		}

		setAttributes( dimensions );
	};
	const getResetDimensionAttributes = ( keys, nextStyle = style ) => ( {
		style: hasSelectedStyleState
			? resetStateDimensions( nextStyle, selectedStyleState, keys )
			: resetDimensions( nextStyle, keys ),
	} );
	const getResetAllFilter =
		( defaultAttributes, keys ) =>
		( attrs = {} ) => ( {
			...( hasSelectedStyleState ? {} : defaultAttributes ),
			...getResetDimensionAttributes( keys, attrs.style ),
		} );

	const onDimensionChange = ( dimension, nextValue ) => {
		const parsedValue = parseFloat( nextValue );
		/**
		 * If we have no value set and we change the unit,
		 * we don't want to set the attribute, as it would
		 * end up having the unit as value without any number.
		 */
		if ( isNaN( parsedValue ) && nextValue ) {
			return;
		}
		const nextDimensions = {
			[ dimension ]: parsedValue < 0 ? '0' : nextValue,
		};
		if ( dimension === 'height' ) {
			nextDimensions.scale = nextValue
				? activeScale || DEFAULT_SCALE
				: undefined;
		}
		setDimensionAttributes( nextDimensions );
	};
	const scaleLabel = _x( 'Scale', 'Image scaling options' );

	const showScaleControl =
		activeHeight || ( activeAspectRatio && activeAspectRatio !== 'auto' );

	const themeOptions = themeRatios?.map( ( { name, ratio } ) => ( {
		label: name,
		value: ratio,
	} ) );

	const defaultOptions = defaultRatios?.map( ( { name, ratio } ) => ( {
		label: name,
		value: ratio,
	} ) );

	const aspectRatioOptions = [
		{
			label: _x(
				'Original',
				'Aspect ratio option for dimensions control'
			),
			value: 'auto',
		},
		...( showDefaultRatios ? defaultOptions : [] ),
		...( themeOptions ? themeOptions : [] ),
	];

	return (
		<>
			<ToolsPanelItem
				key={ `aspect-ratio-${ selectedStyleStateKey }` }
				hasValue={ () => !! activeAspectRatio }
				label={ __( 'Aspect ratio' ) }
				onDeselect={ () =>
					setDimensionAttributes( { aspectRatio: undefined } )
				}
				resetAllFilter={ getResetAllFilter(
					{ aspectRatio: undefined },
					[ 'aspectRatio' ]
				) }
				isShownByDefault
				panelId={ clientId }
			>
				<SelectControl
					__next40pxDefaultSize
					label={ __( 'Aspect ratio' ) }
					value={ activeAspectRatio || 'auto' }
					options={ aspectRatioOptions }
					onChange={ ( nextAspectRatio ) => {
						nextAspectRatio =
							nextAspectRatio === 'auto'
								? undefined
								: nextAspectRatio;
						setDimensionAttributes( {
							aspectRatio: nextAspectRatio,
							scale: nextAspectRatio
								? activeScale || DEFAULT_SCALE
								: undefined,
						} );
					} }
				/>
			</ToolsPanelItem>
			<ToolsPanelItem
				key={ `height-${ selectedStyleStateKey }` }
				className="single-column"
				hasValue={ () => !! activeHeight }
				label={ __( 'Height' ) }
				onDeselect={ () =>
					setDimensionAttributes( {
						height: undefined,
						scale: activeAspectRatio
							? activeScale || DEFAULT_SCALE
							: undefined,
					} )
				}
				resetAllFilter={ getResetAllFilter( { height: undefined }, [
					'height',
				] ) }
				isShownByDefault
				panelId={ clientId }
			>
				<UnitControl
					__next40pxDefaultSize
					label={ __( 'Height' ) }
					labelPosition="top"
					value={ activeHeight || '' }
					min={ 0 }
					onChange={ ( nextHeight ) =>
						onDimensionChange( 'height', nextHeight )
					}
					units={ units }
				/>
			</ToolsPanelItem>
			<ToolsPanelItem
				key={ `width-${ selectedStyleStateKey }` }
				className="single-column"
				hasValue={ () => !! activeWidth }
				label={ __( 'Width' ) }
				onDeselect={ () =>
					setDimensionAttributes( { width: undefined } )
				}
				resetAllFilter={ getResetAllFilter( { width: undefined }, [
					'width',
				] ) }
				isShownByDefault
				panelId={ clientId }
			>
				<UnitControl
					__next40pxDefaultSize
					label={ __( 'Width' ) }
					labelPosition="top"
					value={ activeWidth || '' }
					min={ 0 }
					onChange={ ( nextWidth ) =>
						onDimensionChange( 'width', nextWidth )
					}
					units={ units }
				/>
			</ToolsPanelItem>
			{ showScaleControl && (
				<ToolsPanelItem
					key={ `scale-${ selectedStyleStateKey }` }
					hasValue={ () =>
						!! activeScale && activeScale !== DEFAULT_SCALE
					}
					label={ scaleLabel }
					onDeselect={ () =>
						setDimensionAttributes( {
							scale: DEFAULT_SCALE,
						} )
					}
					resetAllFilter={ getResetAllFilter(
						{ scale: DEFAULT_SCALE },
						[ 'objectFit' ]
					) }
					isShownByDefault
					panelId={ clientId }
				>
					<ToggleGroupControl
						__next40pxDefaultSize
						label={ scaleLabel }
						value={ displayScale }
						help={ scaleHelp[ displayScale ] }
						onChange={ ( value ) =>
							setDimensionAttributes( {
								scale: value,
							} )
						}
						isBlock
					>
						{ SCALE_OPTIONS }
					</ToggleGroupControl>
				</ToolsPanelItem>
			) }
		</>
	);
};

export default DimensionControls;
