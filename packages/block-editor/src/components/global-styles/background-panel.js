/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalUnitControl as UnitControl,
	__experimentalVStack as VStack,
	DropZone,
	Flex,
	FlexItem,
	FocalPointPicker,
	MenuItem,
	VisuallyHidden,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	__experimentalZStack as ZStack,
	__experimentalTruncate as Truncate,
	Dropdown,
	Placeholder,
	Spinner,
	Button,
	ColorIndicator,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __, _x, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { getFilename } from '@wordpress/url';
import {
	useCallback,
	Platform,
	useRef,
	useState,
	useMemo,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { focus } from '@wordpress/dom';
import { isBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import {
	getValueFromVariable,
	useToolsPanelDropdownMenuProps,
	getResolvedValue,
} from './utils';
import { useColorsPerOrigin, useGradientsPerOrigin } from './hooks';
import { setImmutably } from '../../utils/object';
import MediaReplaceFlow from '../media-replace-flow';
import ColorGradientControl from '../colors-gradients/control';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

import {
	globalStylesDataKey,
	globalStylesLinksDataKey,
} from '../../store/private-keys';

const IMAGE_BACKGROUND_TYPE = 'image';
const DEFAULT_CONTROLS = {
	backgroundImage: true,
	background: true,
};
const BACKGROUND_POPOVER_PROPS = {
	placement: 'left-start',
	offset: 36,
	shift: true,
	className: 'block-editor-global-styles-background-panel__popover',
};
const noop = () => {};

/**
 * Checks site settings to see if the background panel may be used.
 * `settings.background.backgroundSize` exists also,
 * but can only be used if settings?.background?.backgroundImage is `true`.
 *
 * @param {Object} settings Site settings
 * @return {boolean}        Whether site settings has activated background panel.
 */
export function useHasBackgroundPanel( settings ) {
	return Platform.OS === 'web' && settings?.background?.backgroundImage;
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
 * Get the help text for the background size control.
 *
 * @param {string} value backgroundSize value.
 * @return {string}      Translated help text.
 */
function backgroundSizeHelpText( value ) {
	if ( value === 'cover' || value === undefined ) {
		return __( 'Image covers the space evenly.' );
	}
	if ( value === 'contain' ) {
		return __( 'Image is contained without distortion.' );
	}
	return __( 'Image has a fixed width.' );
}

/**
 * Converts decimal x and y coords from FocalPointPicker to percentage-based values
 * to use as backgroundPosition value.
 *
 * @param {{x?:number, y?:number}} value FocalPointPicker coords.
 * @return {string}      				 backgroundPosition value.
 */
export const coordsToBackgroundPosition = ( value ) => {
	if ( ! value || ( isNaN( value.x ) && isNaN( value.y ) ) ) {
		return undefined;
	}

	const x = isNaN( value.x ) ? 0.5 : value.x;
	const y = isNaN( value.y ) ? 0.5 : value.y;

	return `${ x * 100 }% ${ y * 100 }%`;
};

/**
 * Converts backgroundPosition value to x and y coords for FocalPointPicker.
 *
 * @param {string} value backgroundPosition value.
 * @return {{x?:number, y?:number}}       FocalPointPicker coords.
 */
export const backgroundPositionToCoords = ( value ) => {
	if ( ! value ) {
		return { x: undefined, y: undefined };
	}

	let [ x, y ] = value.split( ' ' ).map( ( v ) => parseFloat( v ) / 100 );
	x = isNaN( x ) ? undefined : x;
	y = isNaN( y ) ? x : y;

	return { x, y };
};

function InspectorImagePreviewItem( {
	as = 'span',
	imgUrl,
	toggleProps = {},
	filename,
	label,
	className,
} ) {
	return (
		<ItemGroup as={ as } className={ className } { ...toggleProps }>
			<HStack
				justify="flex-start"
				as="span"
				className="block-editor-global-styles-background-panel__inspector-preview-inner"
			>
				<ColorIndicator
					aria-hidden
					style={ {
						'--image-url': imgUrl ? `url(${ imgUrl })` : undefined,
					} }
					className={ clsx(
						'block-editor-global-styles-background-panel__inspector-image-indicator',
						{ 'has-image': !! imgUrl }
					) }
				/>
				<FlexItem as="span" style={ imgUrl ? {} : { flexGrow: 1 } }>
					<Truncate
						numberOfLines={ 1 }
						className="block-editor-global-styles-background-panel__inspector-media-replace-title"
					>
						{ label }
					</Truncate>
					<VisuallyHidden as="span">
						{ imgUrl
							? sprintf(
									/* translators: %s: file name */
									__( 'Background image: %s' ),
									filename || label
							  )
							: __( 'No background image selected' ) }
					</VisuallyHidden>
				</FlexItem>
			</HStack>
		</ItemGroup>
	);
}

function BackgroundControlsPanel( {
	label,
	filename,
	url: imgUrl,
	children,
	hasImageValue,
} ) {
	if ( ! hasImageValue ) {
		return;
	}

	const imgLabel =
		label || getFilename( imgUrl ) || __( 'Add background image' );

	return (
		<Dropdown
			popoverProps={ BACKGROUND_POPOVER_PROPS }
			renderToggle={ ( { onToggle, isOpen } ) => {
				const toggleProps = {
					onClick: onToggle,
					className: clsx(
						'block-editor-global-styles-background-panel__dropdown-toggle',
						{
							'is-open': isOpen,
						}
					),
					'aria-expanded': isOpen,
					'aria-label': __(
						'Background size, position and repeat options.'
					),
					isOpen,
				};
				return (
					<InspectorImagePreviewItem
						imgUrl={ imgUrl }
						filename={ filename }
						label={ imgLabel }
						toggleProps={ toggleProps }
						as="button"
					/>
				);
			} }
			renderContent={ () => (
				<DropdownContentWrapper
					className="block-editor-global-styles-background-panel__dropdown-content-wrapper"
					paddingSize="medium"
				>
					{ children }
				</DropdownContentWrapper>
			) }
		/>
	);
}

function LoadingSpinner() {
	return (
		<Placeholder className="block-editor-global-styles-background-panel__loading">
			<Spinner />
		</Placeholder>
	);
}

function BackgroundImageControls( {
	onChange,
	style,
	inheritedValue,
	onRemoveImage = noop,
	onResetImage = noop,
	displayInPanel,
	defaultValues,
} ) {
	const [ isUploading, setIsUploading ] = useState( false );
	const { getSettings } = useSelect( blockEditorStore );

	const { id, title, url } = style?.background?.backgroundImage || {
		...inheritedValue?.background?.backgroundImage,
	};
	const replaceContainerRef = useRef();
	const { createErrorNotice } = useDispatch( noticesStore );
	const onUploadError = ( message ) => {
		createErrorNotice( message, { type: 'snackbar' } );
		setIsUploading( false );
	};

	const resetBackgroundImage = () =>
		onChange(
			setImmutably(
				style,
				[ 'background', 'backgroundImage' ],
				undefined
			)
		);

	const onSelectMedia = ( media ) => {
		if ( ! media || ! media.url ) {
			resetBackgroundImage();
			setIsUploading( false );
			return;
		}

		if ( isBlobURL( media.url ) ) {
			setIsUploading( true );
			return;
		}

		// For media selections originated from a file upload.
		if (
			( media.media_type &&
				media.media_type !== IMAGE_BACKGROUND_TYPE ) ||
			( ! media.media_type &&
				media.type &&
				media.type !== IMAGE_BACKGROUND_TYPE )
		) {
			onUploadError(
				__( 'Only images can be used as a background image.' )
			);
			return;
		}

		const sizeValue =
			style?.background?.backgroundSize || defaultValues?.backgroundSize;
		const positionValue = style?.background?.backgroundPosition;
		onChange(
			setImmutably( style, [ 'background' ], {
				...style?.background,
				backgroundImage: {
					url: media.url,
					id: media.id,
					source: 'file',
					title: media.title || undefined,
				},
				backgroundPosition:
					/*
					 * A background image uploaded and set in the editor receives a default background position of '50% 0',
					 * when the background image size is the equivalent of "Tile".
					 * This is to increase the chance that the image's focus point is visible.
					 * This is in-editor only to assist with the user experience.
					 */
					! positionValue && ( 'auto' === sizeValue || ! sizeValue )
						? '50% 0'
						: positionValue,
				backgroundSize: sizeValue,
			} )
		);
		setIsUploading( false );
	};

	// Drag and drop callback, restricting image to one.
	const onFilesDrop = ( filesList ) => {
		if ( filesList?.length > 1 ) {
			onUploadError(
				__( 'Only one image can be used as a background image.' )
			);
			return;
		}
		getSettings().mediaUpload( {
			allowedTypes: [ IMAGE_BACKGROUND_TYPE ],
			filesList,
			onFileChange( [ image ] ) {
				onSelectMedia( image );
			},
			onError: onUploadError,
		} );
	};

	const hasValue = hasBackgroundImageValue( style );

	const closeAndFocus = () => {
		const [ toggleButton ] = focus.tabbable.find(
			replaceContainerRef.current
		);
		// Focus the toggle button and close the dropdown menu.
		// This ensures similar behaviour as to selecting an image, where the dropdown is
		// closed and focus is redirected to the dropdown toggle button.
		toggleButton?.focus();
		toggleButton?.click();
	};

	const onRemove = () =>
		onChange(
			setImmutably( style, [ 'background' ], {
				backgroundImage: 'none',
			} )
		);
	const canRemove = ! hasValue && hasBackgroundImageValue( inheritedValue );
	const imgLabel =
		title || getFilename( url ) || __( 'Add background image' );

	return (
		<Item
			ref={ replaceContainerRef }
			className="block-editor-global-styles-background-panel__image-tools-panel-item"
		>
			{ isUploading && <LoadingSpinner /> }
			<MediaReplaceFlow
				mediaId={ id }
				mediaURL={ url }
				allowedTypes={ [ IMAGE_BACKGROUND_TYPE ] }
				accept="image/*"
				onSelect={ onSelectMedia }
				popoverProps={ {
					className: clsx( {
						'block-editor-global-styles-background-panel__media-replace-popover':
							displayInPanel,
					} ),
				} }
				name={
					<InspectorImagePreviewItem
						className="block-editor-global-styles-background-panel__image-preview"
						imgUrl={ url }
						filename={ title }
						label={ imgLabel }
					/>
				}
				variant="secondary"
				onError={ onUploadError }
				onReset={ () => {
					closeAndFocus();
					onResetImage();
				} }
			>
				{ canRemove && (
					<MenuItem
						onClick={ () => {
							closeAndFocus();
							onRemove();
							onRemoveImage();
						} }
					>
						{ __( 'Remove' ) }
					</MenuItem>
				) }
			</MediaReplaceFlow>
			<DropZone
				onFilesDrop={ onFilesDrop }
				label={ __( 'Drop to upload' ) }
			/>
		</Item>
	);
}

function BackgroundSizeControls( {
	onChange,
	style,
	inheritedValue,
	defaultValues,
} ) {
	const sizeValue =
		style?.background?.backgroundSize ||
		inheritedValue?.background?.backgroundSize;
	const repeatValue =
		style?.background?.backgroundRepeat ||
		inheritedValue?.background?.backgroundRepeat;
	const imageValue =
		style?.background?.backgroundImage?.url ||
		inheritedValue?.background?.backgroundImage?.url;
	const isUploadedImage = style?.background?.backgroundImage?.id;
	const positionValue =
		style?.background?.backgroundPosition ||
		inheritedValue?.background?.backgroundPosition;
	const attachmentValue =
		style?.background?.backgroundAttachment ||
		inheritedValue?.background?.backgroundAttachment;

	/*
	 * Set default values for uploaded images.
	 * The default values are passed by the consumer.
	 * Block-level controls may have different defaults to root-level controls.
	 * A falsy value is treated by default as `auto` (Tile).
	 */
	let currentValueForToggle =
		! sizeValue && isUploadedImage
			? defaultValues?.backgroundSize
			: sizeValue || 'auto';
	/*
	 * The incoming value could be a value + unit, e.g. '20px'.
	 * In this case set the value to 'tile'.
	 */
	currentValueForToggle = ! [ 'cover', 'contain', 'auto' ].includes(
		currentValueForToggle
	)
		? 'auto'
		: currentValueForToggle;
	/*
	 * If the current value is `cover` and the repeat value is `undefined`, then
	 * the toggle should be unchecked as the default state. Otherwise, the toggle
	 * should reflect the current repeat value.
	 */
	const repeatCheckedValue = ! (
		repeatValue === 'no-repeat' ||
		( currentValueForToggle === 'cover' && repeatValue === undefined )
	);

	const updateBackgroundSize = ( next ) => {
		// When switching to 'contain' toggle the repeat off.
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
			( currentValueForToggle === 'cover' ||
				currentValueForToggle === 'contain' ) &&
			next === 'auto'
		) {
			nextRepeat = undefined;
			/*
			 * A background image uploaded and set in the editor (an image with a record id),
			 * receives a default background position of '50% 0',
			 * when the toggle switches to "Tile". This is to increase the chance that
			 * the image's focus point is visible.
			 * This is in-editor only to assist with the user experience.
			 */
			if ( !! style?.background?.backgroundImage?.id ) {
				nextPosition = '50% 0';
			}
		}

		/*
		 * Next will be null when the input is cleared,
		 * in which case the value should be 'auto'.
		 */
		if ( ! next && currentValueForToggle === 'auto' ) {
			next = 'auto';
		}

		onChange(
			setImmutably( style, [ 'background' ], {
				...style?.background,
				backgroundPosition: nextPosition,
				backgroundRepeat: nextRepeat,
				backgroundSize: next,
			} )
		);
	};

	const updateBackgroundPosition = ( next ) => {
		onChange(
			setImmutably(
				style,
				[ 'background', 'backgroundPosition' ],
				coordsToBackgroundPosition( next )
			)
		);
	};

	const toggleIsRepeated = () =>
		onChange(
			setImmutably(
				style,
				[ 'background', 'backgroundRepeat' ],
				repeatCheckedValue === true ? 'no-repeat' : 'repeat'
			)
		);

	const toggleScrollWithPage = () =>
		onChange(
			setImmutably(
				style,
				[ 'background', 'backgroundAttachment' ],
				attachmentValue === 'fixed' ? 'scroll' : 'fixed'
			)
		);

	// Set a default background position for non-site-wide, uploaded images with a size of 'contain'.
	const backgroundPositionValue =
		! positionValue && isUploadedImage && 'contain' === sizeValue
			? defaultValues?.backgroundPosition
			: positionValue;

	return (
		<VStack spacing={ 3 } className="single-column">
			<FocalPointPicker
				__nextHasNoMarginBottom
				label={ __( 'Focal point' ) }
				url={ imageValue }
				value={ backgroundPositionToCoords( backgroundPositionValue ) }
				onChange={ updateBackgroundPosition }
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Fixed background' ) }
				checked={ attachmentValue === 'fixed' }
				onChange={ toggleScrollWithPage }
			/>
			<ToggleGroupControl
				__nextHasNoMarginBottom
				size="__unstable-large"
				label={ __( 'Size' ) }
				value={ currentValueForToggle }
				onChange={ updateBackgroundSize }
				isBlock
				help={ backgroundSizeHelpText(
					sizeValue || defaultValues?.backgroundSize
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
			<HStack justify="flex-start" spacing={ 2 } as="span">
				<UnitControl
					aria-label={ __( 'Background image width' ) }
					onChange={ updateBackgroundSize }
					value={ sizeValue }
					size="__unstable-large"
					__unstableInputWidth="100px"
					min={ 0 }
					placeholder={ __( 'Auto' ) }
					disabled={
						currentValueForToggle !== 'auto' ||
						currentValueForToggle === undefined
					}
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Repeat' ) }
					checked={ repeatCheckedValue }
					onChange={ toggleIsRepeated }
					disabled={ currentValueForToggle === 'cover' }
				/>
			</HStack>
		</VStack>
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
			dropdownMenuProps={ dropdownMenuProps }
		>
			{ children }
		</ToolsPanel>
	);
}

const { Tabs } = unlock( componentsPrivateApis );

function ColorPanelTab( {
	isGradient,
	inheritedValue,
	userValue,
	setValue,
	colorGradientControlSettings,
} ) {
	return (
		<ColorGradientControl
			{ ...colorGradientControlSettings }
			showTitle={ false }
			enableAlpha
			__experimentalIsRenderedInSidebar
			colorValue={ isGradient ? undefined : inheritedValue }
			gradientValue={ isGradient ? inheritedValue : undefined }
			onColorChange={ isGradient ? undefined : setValue }
			onGradientChange={ isGradient ? setValue : undefined }
			clearable={ inheritedValue === userValue }
			headingLevel={ 3 }
		/>
	);
}

const LabeledColorIndicators = ( { indicators, label } ) => (
	<Item>
		<HStack justify="flex-start">
			<ZStack isLayered={ false } offset={ -8 }>
				{ indicators.map( ( indicator, index ) => (
					<Flex key={ index } expanded={ false }>
						<ColorIndicator colorValue={ indicator } />
					</Flex>
				) ) }
			</ZStack>
			<FlexItem
				className="block-editor-panel-color-gradient-settings__color-name"
				title={ label }
			>
				{ label }
			</FlexItem>
		</HStack>
	</Item>
);

function ColorPanelDropdown( {
	label,
	indicators,
	tabs,
	colorGradientControlSettings,
} ) {
	const currentTab = tabs.find( ( tab ) => tab.userValue !== undefined );
	const { key: firstTabKey, ...firstTab } = tabs[ 0 ] ?? {};
	return (
		<Item className="block-editor-global-styles-background-panel__color-tools-panel-item">
			<Dropdown
				popoverProps={ BACKGROUND_POPOVER_PROPS }
				className="block-editor-tools-panel-color-gradient-settings__dropdown"
				renderToggle={ ( { onToggle, isOpen } ) => {
					const toggleProps = {
						onClick: onToggle,
						className: clsx(
							'block-editor-panel-color-gradient-settings__dropdown',
							{ 'is-open': isOpen }
						),
						'aria-expanded': isOpen,
						'aria-label': sprintf(
							/* translators: %s is the type of color property, e.g., "background" */
							__( 'Color %s styles' ),
							label
						),
					};

					return (
						// no-restricted-syntax
						<Button
							{ ...toggleProps }
							__next40pxDefaultSize={ false }
						>
							<LabeledColorIndicators
								indicators={ indicators }
								label={ label }
							/>
						</Button>
					);
				} }
				renderContent={ () => (
					<DropdownContentWrapper paddingSize="none">
						<div className="block-editor-panel-color-gradient-settings__dropdown-content">
							{ tabs.length === 1 && (
								<ColorPanelTab
									key={ firstTabKey }
									{ ...firstTab }
									colorGradientControlSettings={
										colorGradientControlSettings
									}
								/>
							) }
							{ tabs.length > 1 && (
								<Tabs defaultTabId={ currentTab?.key }>
									<Tabs.TabList>
										{ tabs.map( ( tab ) => (
											<Tabs.Tab
												key={ tab.key }
												tabId={ tab.key }
											>
												{ tab.label }
											</Tabs.Tab>
										) ) }
									</Tabs.TabList>

									{ tabs.map( ( tab ) => {
										const { key: tabKey, ...restTabProps } =
											tab;
										return (
											<Tabs.TabPanel
												key={ tabKey }
												tabId={ tabKey }
												focusable={ false }
											>
												<ColorPanelTab
													key={ tabKey }
													{ ...restTabProps }
													colorGradientControlSettings={
														colorGradientControlSettings
													}
												/>
											</Tabs.TabPanel>
										);
									} ) }
								</Tabs>
							) }
						</div>
					</DropdownContentWrapper>
				) }
			/>
		</Item>
	);
}

export default function BackgroundPanel( {
	as: Wrapper = BackgroundToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
	defaultValues = {},
	headerLabel = __( 'Tools' ),
	showColorControl = false,
} ) {
	/*
	 * Resolve any inherited "ref" pointers.
	 * Should the block editor need resolved, inherited values
	 * across all controls, this could be abstracted into a hook,
	 * e.g., useResolveGlobalStyle
	 */
	const { globalStyles, _links } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const _settings = getSettings();
		return {
			globalStyles: _settings[ globalStylesDataKey ],
			_links: _settings[ globalStylesLinksDataKey ],
		};
	}, [] );

	const colors = useColorsPerOrigin( settings );
	const gradients = useGradientsPerOrigin( settings );
	const areCustomSolidsEnabled = settings?.color?.custom;
	const areCustomGradientsEnabled = settings?.color?.customGradient;
	const hasSolidColors = colors.length > 0 || areCustomSolidsEnabled;
	const hasGradientColors = gradients.length > 0 || areCustomGradientsEnabled;
	const encodeColorValue = ( colorValue ) => {
		const allColors = colors.flatMap(
			( { colors: originColors } ) => originColors
		);
		const colorObject = allColors.find(
			( { color } ) => color === colorValue
		);
		return colorObject
			? 'var:preset|color|' + colorObject.slug
			: colorValue;
	};
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

	const decodeValue = ( rawValue ) =>
		getValueFromVariable( { settings }, '', rawValue );
	const shouldShowBackgroundColorControls = useHasBackgroundPanel( settings );
	const backgroundColor = decodeValue( inheritedValue?.color?.background );
	const userBackgroundColor = decodeValue( value?.color?.background );
	const gradient = decodeValue( inheritedValue?.color?.gradient );
	const userGradient = decodeValue( value?.color?.gradient );
	const hasBackground = () => !! userBackgroundColor || !! userGradient;

	const setBackgroundColor = ( newColor ) => {
		const newValue = setImmutably(
			value,
			[ 'color', 'background' ],
			encodeColorValue( newColor )
		);
		newValue.color.gradient = undefined;
		onChange( newValue );
	};

	const setGradient = ( newGradient ) => {
		const newValue = setImmutably(
			value,
			[ 'color', 'gradient' ],
			encodeGradientValue( newGradient )
		);
		newValue.color.background = undefined;
		onChange( newValue );
	};

	const resetBackgroundColor = () => {
		const newValue = setImmutably(
			value,
			[ 'color', 'background' ],
			undefined
		);
		newValue.color.gradient = undefined;
		onChange( newValue );
	};

	const resolvedInheritedValue = useMemo( () => {
		const resolvedValues = {
			background: {},
		};

		if ( ! inheritedValue?.background ) {
			return inheritedValue;
		}

		Object.entries( inheritedValue?.background ).forEach(
			( [ key, backgroundValue ] ) => {
				resolvedValues.background[ key ] = getResolvedValue(
					backgroundValue,
					{
						styles: globalStyles,
						_links,
					}
				);
			}
		);
		return resolvedValues;
	}, [ globalStyles, _links, inheritedValue ] );

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			background: {},
			color: undefined,
		};
	}, [] );

	const resetBackground = () =>
		onChange( setImmutably( value, [ 'background' ], {} ) );

	const { title, url } = value?.background?.backgroundImage || {
		...resolvedInheritedValue?.background?.backgroundImage,
	};
	const hasImageValue =
		hasBackgroundImageValue( value ) ||
		hasBackgroundImageValue( resolvedInheritedValue );

	const imageValue =
		value?.background?.backgroundImage ||
		inheritedValue?.background?.backgroundImage;

	const shouldShowBackgroundImageControls =
		hasImageValue &&
		'none' !== imageValue &&
		( settings?.background?.backgroundSize ||
			settings?.background?.backgroundPosition ||
			settings?.background?.backgroundRepeat );

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
			headerLabel={ headerLabel }
		>
			<ItemGroup
				className="block-editor-global-styles-background-panel__inspector-media-replace-container"
				isSeparated
				isBordered
			>
				<ToolsPanelItem
					hasValue={ () => !! value?.background }
					label={ __( 'Image' ) }
					onDeselect={ resetBackground }
					isShownByDefault={ defaultControls.backgroundImage }
					panelId={ panelId }
				>
					{ shouldShowBackgroundImageControls ? (
						<BackgroundControlsPanel
							label={ title }
							filename={ title }
							url={ url }
							hasImageValue={ hasImageValue }
						>
							<VStack spacing={ 3 } className="single-column">
								<BackgroundImageControls
									onChange={ onChange }
									style={ value }
									inheritedValue={ resolvedInheritedValue }
									displayInPanel
									onResetImage={ () => {
										resetBackground();
									} }
									defaultValues={ defaultValues }
								/>
								<BackgroundSizeControls
									onChange={ onChange }
									panelId={ panelId }
									style={ value }
									defaultValues={ defaultValues }
									inheritedValue={ resolvedInheritedValue }
								/>
							</VStack>
						</BackgroundControlsPanel>
					) : (
						<BackgroundImageControls
							onChange={ onChange }
							style={ value }
							inheritedValue={ resolvedInheritedValue }
							defaultValues={ defaultValues }
							onResetImage={ () => {
								resetBackground();
							} }
						/>
					) }
				</ToolsPanelItem>
				{ shouldShowBackgroundColorControls && showColorControl && (
					<ToolsPanelItem
						hasValue={ hasBackground }
						label={ __( 'Color' ) }
						onDeselect={ resetBackgroundColor }
						isShownByDefault={ defaultControls.background }
						panelId={ panelId }
					>
						<ColorPanelDropdown
							key="background"
							label={ __( 'Color' ) }
							hasValue={ hasBackground }
							resetValue={ resetBackgroundColor }
							isShownByDefault={ defaultControls.background }
							indicators={ [ gradient ?? backgroundColor ] }
							tabs={ [
								hasSolidColors && {
									key: 'background',
									label: __( 'Background' ),
									inheritedValue: backgroundColor,
									setValue: setBackgroundColor,
									userValue: userBackgroundColor,
								},
								hasGradientColors && {
									key: 'gradient',
									label: __( 'Gradient' ),
									inheritedValue: gradient,
									setValue: setGradient,
									userValue: userGradient,
									isGradient: true,
								},
							].filter( Boolean ) }
							colorGradientControlSettings={ {
								colors,
								disableCustomColors: ! areCustomSolidsEnabled,
								gradients,
								disableCustomGradients:
									! areCustomGradientsEnabled,
							} }
							panelId={ panelId }
						/>
					</ToolsPanelItem>
				) }
			</ItemGroup>
		</Wrapper>
	);
}
