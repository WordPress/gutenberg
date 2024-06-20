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
	__experimentalUnitControl as UnitControl,
	__experimentalVStack as VStack,
	DropZone,
	FlexItem,
	FocalPointPicker,
	MenuItem,
	VisuallyHidden,
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
	Dropdown,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	privateApis as componentsPrivateApis,
	SelectControl,
} from '@wordpress/components';
import { __, _x, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { getFilename } from '@wordpress/url';
import {
	useCallback,
	Platform,
	useRef,
	useState,
	useEffect,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { focus } from '@wordpress/dom';
import { isBlobURL } from '@wordpress/blob';
import { reusableBlock, Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';
import MediaReplaceFlow from '../media-replace-flow';
import { store as blockEditorStore } from '../../store';
import { getResolvedThemeFilePath } from './theme-file-uri-utils';
import { unlock } from '../../lock-unlock';

const IMAGE_BACKGROUND_TYPE = 'image';
const DEFAULT_CONTROLS = {
	backgroundImage: true,
	backgroundSize: true,
};
const BACKGROUND_POPOVER_PROPS = {
	placement: 'left-start',
	offset: 36,
	shift: true,
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
	onToggleCallback = noop,
} ) {
	useEffect( () => {
		if ( typeof toggleProps?.isOpen !== 'undefined' ) {
			onToggleCallback( toggleProps?.isOpen );
		}
	}, [ toggleProps?.isOpen, onToggleCallback ] );
	return (
		<ItemGroup as={ as } className={ className } { ...toggleProps }>
			<HStack
				justify="flex-start"
				as="span"
				className="block-editor-global-styles-background-panel__inspector-preview-inner"
			>
				{ imgUrl && (
					<span
						className={ clsx(
							'block-editor-global-styles-background-panel__inspector-image-indicator-wrapper',
							{
								'has-image': imgUrl,
							}
						) }
						aria-hidden
					>
						<span
							className="block-editor-global-styles-background-panel__inspector-image-indicator"
							style={ {
								backgroundImage: `url(${ imgUrl })`,
							} }
						/>
					</span>
				) }
				<FlexItem as="span" style={ { flexGrow: 1 } }>
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

function InspectorImagePreviewToggle( {
	label,
	filename,
	url: imgUrl,
	children,
	onToggle: onToggleCallback = noop,
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
			className="block-editor-global-styles-background-panel__inspector-media-replace"
			renderToggle={ ( { onToggle, isOpen } ) => {
				const toggleProps = {
					onClick: onToggle,
					className:
						'block-editor-global-styles-background-panel__dropdown-toggle',
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
						onToggleCallback={ onToggleCallback }
					/>
				);
			} }
			renderContent={ () => (
				<DropdownContentWrapper
					className="block-editor-global-styles-background-panel__dropdown-content-wrapper"
					paddingSize="none"
				>
					{ children }
				</DropdownContentWrapper>
			) }
		/>
	);
}

function BackgroundImageToolsPanelItem( {
	panelId,
	isShownByDefault,
	onChange,
	style,
	inheritedValue,
	shouldShowBackgroundImageControls,
} ) {
	const mediaUpload = useSelect(
		( select ) => select( blockEditorStore ).getSettings().mediaUpload,
		[]
	);

	const { id, title, url } = style?.background?.backgroundImage || {
		...inheritedValue?.background?.backgroundImage,
	};
	const hasImageValue =
		hasBackgroundImageValue( style ) ||
		hasBackgroundImageValue( inheritedValue );
	const replaceContainerRef = useRef();
	const { createErrorNotice } = useDispatch( noticesStore );
	const onUploadError = ( message ) => {
		createErrorNotice( message, { type: 'snackbar' } );
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
			return;
		}

		if ( isBlobURL( media.url ) ) {
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

		const sizeValue = style?.background?.backgroundSize;
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
					! positionValue && ( 'auto' === sizeValue || ! sizeValue )
						? '50% 0'
						: positionValue,
			} )
		);
	};

	const onFilesDrop = ( filesList ) => {
		mediaUpload( {
			allowedTypes: [ IMAGE_BACKGROUND_TYPE ],
			filesList,
			onFileChange( [ image ] ) {
				if ( isBlobURL( image?.url ) ) {
					return;
				}
				onSelectMedia( image );
			},
			onError: onUploadError,
		} );
	};

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			style: {
				...previousValue.style,
				background: undefined,
			},
		};
	}, [] );

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
			setImmutably( style, [ 'background', 'backgroundImage' ], 'none' )
		);
	const canRemove = ! hasValue && hasBackgroundImageValue( inheritedValue );
	const imgLabel =
		title || getFilename( url ) || __( 'Add background image' );

	return (
		<ToolsPanelItem
			className={ clsx(
				'single-column',
				'block-editor-global-styles-background-panel__image-tools-panel-item',
				{
					'is-wide':
						hasImageValue && ! shouldShowBackgroundImageControls,
				}
			) }
			hasValue={ () => hasValue }
			label={ __( 'Background image' ) }
			onDeselect={ resetBackgroundImage }
			isShownByDefault={ isShownByDefault }
			resetAllFilter={ resetAllFilter }
			panelId={ panelId }
		>
			<div ref={ replaceContainerRef }>
				<MediaReplaceFlow
					mediaId={ id }
					mediaURL={ url }
					allowedTypes={ [ IMAGE_BACKGROUND_TYPE ] }
					accept="image/*"
					onSelect={ onSelectMedia }
					name={
						hasImageValue && shouldShowBackgroundImageControls ? (
							<Icon icon={ reusableBlock } />
						) : (
							<InspectorImagePreviewItem
								className="block-editor-global-styles-background-panel__image-preview"
								imgUrl={ url }
								filename={ title }
								label={ imgLabel }
							/>
						)
					}
					variant="secondary"
				>
					{ canRemove && (
						<MenuItem
							onClick={ () => {
								closeAndFocus();
								onRemove();
							} }
						>
							{ __( 'Remove' ) }
						</MenuItem>
					) }
					{ hasValue && (
						<MenuItem
							onClick={ () => {
								closeAndFocus();
								resetBackgroundImage();
							} }
						>
							{ __( 'Reset ' ) }
						</MenuItem>
					) }
				</MediaReplaceFlow>
				<DropZone
					onFilesDrop={ onFilesDrop }
					label={ __( 'Drop to upload' ) }
				/>
			</div>
		</ToolsPanelItem>
	);
}

function BackgroundSizeToolsPanelItem( {
	onChange,
	style,
	inheritedValue,
	defaultValues,
	themeFileURIs,
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
	const positionValue =
		style?.background?.backgroundPosition ||
		inheritedValue?.background?.backgroundPosition;

	/*
	 * An `undefined` value is replaced with any supplied
	 * default control value for the toggle group control.
	 * An empty string is treated as `auto` - this allows a user
	 * to select "Size" and then enter a custom value, with an
	 * empty value being treated as `auto`.
	 */
	const currentValueForToggle =
		( sizeValue !== undefined &&
			sizeValue !== 'cover' &&
			sizeValue !== 'contain' ) ||
		sizeValue === ''
			? 'auto'
			: sizeValue || defaultValues?.backgroundSize;

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

	const { Tabs } = unlock( componentsPrivateApis );

	return (
		<Tabs>
			<Tabs.TabList>
				<Tabs.Tab tabId="size">{ __( 'Style' ) }</Tabs.Tab>
				<Tabs.Tab tabId="position">{ __( 'Position' ) }</Tabs.Tab>
			</Tabs.TabList>
			<Tabs.TabPanel
				tabId="size"
				focusable={ false }
				className="block-editor-global-styles-background-panel__tab-panel"
			>
				<VStack spacing={ 3 } className="single-column">
					<HStack
						className="block-editor-global-styles-background-panel__size-controls"
						spacing={ 4 }
						justify="space-between"
						alignment="top"
					>
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Size' ) }
							options={ [
								{
									label: _x(
										'Cover',
										'Size option for background image control'
									),
									value: 'cover',
								},
								{
									label: _x(
										'Contain',
										'Size option for background image control'
									),
									value: 'contain',
								},
								{
									label: _x(
										'Tile',
										'Size option for background image control'
									),
									value: 'auto',
								},
							] }
							value={ currentValueForToggle }
							onChange={ updateBackgroundSize }
						/>

						{ currentValueForToggle === 'auto' && (
							<UnitControl
								label={ __( 'Width' ) }
								aria-label={ __( 'Background image width' ) }
								onChange={ updateBackgroundSize }
								value={ sizeValue }
								size="__unstable-large"
								__unstableInputWidth="100px"
								min={ 0 }
								placeholder={ __( 'Auto' ) }
							/>
						) }
					</HStack>
					{ currentValueForToggle !== 'cover' && (
						<ToggleControl
							label={ __( 'Repeat' ) }
							checked={ repeatCheckedValue }
							onChange={ toggleIsRepeated }
						/>
					) }
				</VStack>
			</Tabs.TabPanel>
			<Tabs.TabPanel
				tabId="position"
				focusable={ false }
				className="block-editor-global-styles-background-panel__tab-panel"
			>
				<FocalPointPicker
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Position' ) }
					url={ getResolvedThemeFilePath(
						imageValue,
						themeFileURIs
					) }
					value={ backgroundPositionToCoords( positionValue ) }
					onChange={ updateBackgroundPosition }
				/>
			</Tabs.TabPanel>
		</Tabs>
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
		<VStack
			as={ ToolsPanel }
			spacing={ 4 }
			label={ headerLabel }
			resetAll={ resetAll }
			panelId={ panelId }
			dropdownMenuProps={ dropdownMenuProps }
		>
			{ children }
		</VStack>
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
	headerLabel = __( 'Background image' ),
	themeFileURIs,
} ) {
	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			background: {},
		};
	}, [] );
	const { title, url } = value?.background?.backgroundImage || {
		...inheritedValue?.background?.backgroundImage,
	};
	const hasImageValue =
		hasBackgroundImageValue( value ) ||
		hasBackgroundImageValue( inheritedValue );

	const hasSizeValue =
		hasBackgroundSizeValue( value ) ||
		hasBackgroundSizeValue( inheritedValue );

	const shouldShowBackgroundImageControls =
		hasImageValue &&
		( settings?.background?.backgroundSize ||
			settings?.background?.backgroundPosition ||
			settings?.background?.backgroundRepeat );
	const resetBackgroundSize = () =>
		onChange(
			setImmutably( value, [ 'background' ], {
				...value?.background,
				backgroundPosition: undefined,
				backgroundRepeat: undefined,
				backgroundSize: undefined,
			} )
		);
	const [ isDropDownOpen, setIsDropDownOpen ] = useState( false );

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
			headerLabel={ headerLabel }
		>
			<div
				className={ clsx(
					'block-editor-global-styles-background-panel__inspector-media-replace-container',
					{ 'is-open': isDropDownOpen, 'has-image': hasImageValue }
				) }
			>
				{ shouldShowBackgroundImageControls && (
					<InspectorImagePreviewToggle
						label={ title }
						filename={ title }
						url={ getResolvedThemeFilePath( url, themeFileURIs ) }
						onToggle={ setIsDropDownOpen }
						hasImageValue={ hasImageValue }
					>
						<BackgroundSizeToolsPanelItem
							onChange={ onChange }
							panelId={ panelId }
							isShownByDefault={ defaultControls.backgroundImage }
							style={ value }
							defaultValues={ defaultValues }
							inheritedValue={ inheritedValue }
							themeFileURIs={ themeFileURIs }
						/>
					</InspectorImagePreviewToggle>
				) }
				<BackgroundImageToolsPanelItem
					onChange={ onChange }
					panelId={ panelId }
					style={ value }
					inheritedValue={ inheritedValue }
					settings={ settings }
					isShownByDefault={ defaultControls.backgroundImage }
					shouldShowBackgroundImageControls={
						shouldShowBackgroundImageControls
					}
				/>
			</div>

			{ /* Dummy ToolsPanel items, so we can control what's in the dropdown popover */ }
			<ToolsPanelItem
				hasValue={ () => hasSizeValue }
				label={ __( 'Size' ) }
				onDeselect={ resetBackgroundSize }
				isShownByDefault={ defaultControls.backgroundImage }
				panelId={ panelId }
				className="block-editor-global-styles-background-panel__hidden-tools-panel-item"
			/>
		</Wrapper>
	);
}
