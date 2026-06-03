/**
 * WordPress dependencies
 */
import {
	FocalPointPicker,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalUnitControl as UnitControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useCallback, Platform } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { getValueFromVariable } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import BackgroundImageControl, {
	coordsToBackgroundPosition,
	backgroundPositionToCoords,
	backgroundSizeHelpText,
} from '../background-image-control';
import { ColorPanelDropdown } from './color-panel';
import { useGradientsPerOrigin } from './hooks';
import { useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';

const DEFAULT_CONTROLS = {
	backgroundImage: true,
	gradient: true,
};

const DEFAULT_BACKGROUND_SIZE = 'cover';

/**
 * Checks site settings to see if the requested feature's control may be used.
 *
 * @param {Object} settings Site settings.
 * @param {string} feature  Background feature to check.
 * @return {boolean}        Whether site settings has activated background panel.
 */
export function useHasBackgroundControl( settings, feature ) {
	return Platform.OS === 'web' && settings?.background?.[ feature ];
}

/**
 * Checks site settings to see if the background panel may be used.
 * `settings.background.backgroundSize` exists also,
 * but can only be used if settings?.background?.backgroundImage is `true`.
 *
 * @param {Object} settings Site settings
 * @return {boolean}        Whether site settings has activated background panel.
 */
export function useHasBackgroundPanel( settings ) {
	const { backgroundImage, gradient } = settings?.background || {};
	return Platform.OS === 'web' && ( backgroundImage || gradient );
}

/**
 * Checks if there is a current value in the background size block support
 * attributes. Background size values include background size as well
 * as background position.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background size value set.
 */
export function hasBackgroundSizeValue( style ) {
	return (
		style?.background?.backgroundPosition !== undefined ||
		style?.background?.backgroundSize !== undefined
	);
}

/**
 * Checks if there is a current value in the background image block support
 * attributes.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background image value set.
 */
export function hasBackgroundImageValue( style ) {
	return (
		!! style?.background?.backgroundImage?.id ||
		// Supports url() string values in theme.json.
		'string' === typeof style?.background?.backgroundImage ||
		!! style?.background?.backgroundImage?.url
	);
}

/**
 * Checks if there is a current value in the background gradient block support
 * attributes.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background gradient value set.
 */
export function hasBackgroundGradientValue( style ) {
	return (
		'string' === typeof style?.background?.gradient &&
		style?.background?.gradient !== ''
	);
}

function BackgroundToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
	headerLabel,
} ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ headerLabel }
			resetAll={ resetAll }
			panelId={ panelId }
			hasInnerWrapper
			className="background-block-support-panel"
			__experimentalFirstVisibleItemClass="first"
			__experimentalLastVisibleItemClass="last"
			dropdownMenuProps={ dropdownMenuProps }
		>
			<div className="background-block-support-panel__inner-wrapper">
				{ children }
			</div>
		</ToolsPanel>
	);
}

export default function BackgroundImagePanel( {
	as: Wrapper = BackgroundToolsPanel,
	value,
	onChange,
	inheritedValue,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
	defaultValues = {},
	headerLabel = __( 'Background' ),
} ) {
	const gradients = useGradientsPerOrigin( settings );
	const areCustomGradientsEnabled = settings?.color?.customGradient;
	const hasGradientColors = gradients.length > 0 || areCustomGradientsEnabled;

	const hasBackgroundGradientControl = useHasBackgroundControl(
		settings,
		'gradient'
	);
	const showBackgroundGradientControl =
		hasGradientColors && hasBackgroundGradientControl;
	const showBackgroundImageControl = useHasBackgroundControl(
		settings,
		'backgroundImage'
	);

	const resetAllFilter = useCallback(
		( previousValue ) => {
			return {
				...previousValue,
				background: {},
				color: hasBackgroundGradientControl
					? {
							...previousValue?.color,
							gradient: undefined,
					  }
					: previousValue?.color,
			};
		},
		[ hasBackgroundGradientControl ]
	);

	if ( ! showBackgroundGradientControl && ! showBackgroundImageControl ) {
		return null;
	}

	const decodeValue = ( rawValue ) =>
		getValueFromVariable( { settings }, '', rawValue );
	const encodeGradientValue = ( gradientValue ) => {
		const allGradients = gradients.flatMap(
			( { gradients: originGradients } ) => originGradients
		);
		const gradientObject = allGradients.find(
			( { gradient } ) => gradient === gradientValue
		);
		return gradientObject
			? 'var:preset|gradient|' + gradientObject.slug
			: gradientValue;
	};

	const resetBackground = () =>
		onChange(
			setImmutably(
				value,
				[ 'background', 'backgroundImage' ],
				undefined
			)
		);

	const resetGradient = () => {
		let newValue = setImmutably(
			value,
			[ 'background', 'gradient' ],
			undefined
		);
		newValue = setImmutably( newValue, [ 'color', 'gradient' ], undefined );
		onChange( newValue );
	};

	// Get current gradient value, decoding preset slug references.
	// Fall back to color.gradient for legacy blocks that haven't migrated
	// to background.gradient yet (mirrors block inspector fallback in
	// packages/block-editor/src/hooks/background.js).
	const currentGradient = decodeValue(
		value?.background?.gradient ?? value?.color?.gradient
	);
	const inheritedGradient = decodeValue(
		inheritedValue?.background?.gradient ?? inheritedValue?.color?.gradient
	);

	// Set gradient value, encoding preset matches as slug references.
	// Also clear color.gradient to migrate from the legacy location,
	// matching the block inspector behavior in hooks/background.js.
	const setGradient = ( newGradient ) => {
		let newValue = setImmutably(
			value,
			[ 'background', 'gradient' ],
			encodeGradientValue( newGradient )
		);
		newValue = setImmutably( newValue, [ 'color', 'gradient' ], undefined );
		onChange( newValue );
	};

	const hasImage =
		hasBackgroundImageValue( value ) ||
		hasBackgroundImageValue( inheritedValue );

	// Size control state — mirrors BackgroundSizeControls logic.
	const sizeValue =
		value?.background?.backgroundSize ||
		inheritedValue?.background?.backgroundSize;
	const repeatValue =
		value?.background?.backgroundRepeat ||
		inheritedValue?.background?.backgroundRepeat;
	const positionValue =
		value?.background?.backgroundPosition ||
		inheritedValue?.background?.backgroundPosition;
	const attachmentValue =
		value?.background?.backgroundAttachment ||
		inheritedValue?.background?.backgroundAttachment;
	const imageUrl =
		value?.background?.backgroundImage?.url ||
		inheritedValue?.background?.backgroundImage?.url;
	const isUploadedImage = value?.background?.backgroundImage?.id;

	let currentSizeToggle =
		! sizeValue && isUploadedImage
			? defaultValues?.backgroundSize ?? DEFAULT_BACKGROUND_SIZE
			: sizeValue || 'auto';
	if ( ! [ 'cover', 'contain', 'auto' ].includes( currentSizeToggle ) ) {
		currentSizeToggle = 'auto';
	}

	const repeatCheckedValue = ! (
		repeatValue === 'no-repeat' ||
		( currentSizeToggle === 'cover' && repeatValue === undefined )
	);

	const backgroundPositionValue =
		! positionValue && isUploadedImage && 'contain' === sizeValue
			? defaultValues?.backgroundPosition
			: positionValue;

	const updateBackgroundPosition = ( next ) => {
		onChange(
			setImmutably(
				value,
				[ 'background', 'backgroundPosition' ],
				coordsToBackgroundPosition( next )
			)
		);
	};

	const updateBackgroundSize = ( next ) => {
		let nextRepeat = repeatValue;
		let nextPosition = positionValue;

		if ( next === 'contain' ) {
			nextRepeat = 'no-repeat';
			nextPosition = undefined;
		}
		if ( next === 'cover' ) {
			nextRepeat = undefined;
			nextPosition = undefined;
		}
		if (
			( currentSizeToggle === 'cover' ||
				currentSizeToggle === 'contain' ) &&
			next === 'auto'
		) {
			nextRepeat = undefined;
			if ( !! value?.background?.backgroundImage?.id ) {
				nextPosition = '50% 0';
			}
		}
		if ( ! next && currentSizeToggle === 'auto' ) {
			next = 'auto';
		}

		onChange(
			setImmutably( value, [ 'background' ], {
				...value?.background,
				backgroundPosition: nextPosition,
				backgroundRepeat: nextRepeat,
				backgroundSize: next,
			} )
		);
	};

	const toggleIsRepeated = () =>
		onChange(
			setImmutably(
				value,
				[ 'background', 'backgroundRepeat' ],
				repeatCheckedValue === true ? 'no-repeat' : 'repeat'
			)
		);

	const toggleScrollWithPage = () => {
		const enablingFixed = attachmentValue !== 'fixed';
		onChange(
			setImmutably( value, [ 'background' ], {
				...value?.background,
				backgroundAttachment: enablingFixed ? 'fixed' : undefined,
				// Clear focal point when enabling fixed, mirroring the Cover block's
				// toggleParallax behavior. With background-attachment:fixed the position
				// is viewport-relative, so the element-relative focal point no longer
				// applies. The picker stays visible so the user can still set a position
				// that will take effect when fixed falls back to scroll on mobile.
				...( enablingFixed ? { backgroundPosition: undefined } : {} ),
			} )
		);
	};

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
			headerLabel={ headerLabel }
		>
			{ showBackgroundImageControl && (
				<ToolsPanelItem
					className="block-editor-background-panel__item"
					hasValue={ () => hasBackgroundImageValue( value ) }
					label={ __( 'Image' ) }
					onDeselect={ resetBackground }
					isShownByDefault={ defaultControls.backgroundImage }
					panelId={ panelId }
				>
					<BackgroundImageControl
						value={ value }
						onChange={ onChange }
						settings={ settings }
						inheritedValue={ inheritedValue }
						defaultControls={ defaultControls }
						defaultValues={ defaultValues }
					/>
				</ToolsPanelItem>
			) }
			{ showBackgroundGradientControl && (
				<ColorPanelDropdown
					className="block-editor-background-panel__item"
					label={ __( 'Gradient' ) }
					hasValue={ () => hasBackgroundGradientValue( value ) }
					resetValue={ resetGradient }
					isShownByDefault={ defaultControls.gradient }
					indicators={ [ currentGradient ] }
					tabs={ [
						{
							key: 'gradient',
							label: __( 'Gradient' ),
							inheritedValue:
								currentGradient ?? inheritedGradient,
							setValue: setGradient,
							userValue: currentGradient,
							isGradient: true,
						},
					] }
					colorGradientControlSettings={ {
						gradients,
						disableCustomGradients: ! areCustomGradientsEnabled,
					} }
					panelId={ panelId }
				/>
			) }
			{ showBackgroundImageControl && hasImage && (
				<>
					<ToolsPanelItem
						label={ __( 'Focal point' ) }
						isShownByDefault
						hasValue={ () => !! positionValue }
						onDeselect={ () =>
							onChange(
								setImmutably(
									value,
									[ 'background', 'backgroundPosition' ],
									undefined
								)
							)
						}
						panelId={ panelId }
					>
						<FocalPointPicker
							label={ __( 'Focal point' ) }
							url={ imageUrl }
							value={ backgroundPositionToCoords(
								backgroundPositionValue
							) }
							onChange={ updateBackgroundPosition }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Fixed background' ) }
						isShownByDefault
						hasValue={ () => attachmentValue === 'fixed' }
						onDeselect={ () =>
							onChange(
								setImmutably(
									value,
									[ 'background', 'backgroundAttachment' ],
									undefined
								)
							)
						}
						panelId={ panelId }
					>
						<ToggleControl
							label={ __( 'Fixed background' ) }
							checked={ attachmentValue === 'fixed' }
							onChange={ toggleScrollWithPage }
						/>
					</ToolsPanelItem>
					{ settings?.background?.backgroundSize && (
						<>
							<ToolsPanelItem
								label={ __( 'Size' ) }
								isShownByDefault
								hasValue={ () => !! sizeValue }
								onDeselect={ () =>
									updateBackgroundSize(
										defaultValues?.backgroundSize ??
											DEFAULT_BACKGROUND_SIZE
									)
								}
								panelId={ panelId }
							>
								<ToggleGroupControl
									size="__unstable-large"
									label={ __( 'Size' ) }
									value={ currentSizeToggle }
									onChange={ updateBackgroundSize }
									isBlock
									help={ backgroundSizeHelpText(
										sizeValue ||
											defaultValues?.backgroundSize
									) }
								>
									<ToggleGroupControlOption
										key="cover"
										value="cover"
										label={ _x(
											'Cover',
											'Size option for background image control'
										) }
									/>
									<ToggleGroupControlOption
										key="contain"
										value="contain"
										label={ _x(
											'Contain',
											'Size option for background image control'
										) }
									/>
									<ToggleGroupControlOption
										key="tile"
										value="auto"
										label={ _x(
											'Tile',
											'Size option for background image control'
										) }
									/>
								</ToggleGroupControl>
								{ currentSizeToggle === 'auto' && (
									<UnitControl
										aria-label={ __(
											'Background image width'
										) }
										onChange={ updateBackgroundSize }
										value={ sizeValue }
										size="__unstable-large"
										__unstableInputWidth="100px"
										min={ 0 }
										placeholder={ __( 'Auto' ) }
									/>
								) }
							</ToolsPanelItem>
							<ToolsPanelItem
								label={ __( 'Repeat' ) }
								isShownByDefault
								hasValue={ () => repeatValue === 'repeat' }
								onDeselect={ () =>
									onChange(
										setImmutably(
											value,
											[
												'background',
												'backgroundRepeat',
											],
											undefined
										)
									)
								}
								panelId={ panelId }
							>
								<ToggleControl
									label={ __( 'Repeat' ) }
									checked={ repeatCheckedValue }
									onChange={ toggleIsRepeated }
									disabled={ currentSizeToggle === 'cover' }
								/>
							</ToolsPanelItem>
						</>
					) }
				</>
			) }
		</Wrapper>
	);
}
