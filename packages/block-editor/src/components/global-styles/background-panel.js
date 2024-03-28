/**
 * External dependencies
 */
import classnames from 'classnames';

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
	FlexItem,
	FocalPointPicker,
	MenuItem,
	VisuallyHidden,
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
	Dropdown,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { getFilename } from '@wordpress/url';
import { useCallback, Platform, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { focus } from '@wordpress/dom';
import { isBlobURL } from '@wordpress/blob';
import { reusableBlock, Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { TOOLSPANEL_DROPDOWNMENU_PROPS } from './utils';
import { setImmutably } from '../../utils/object';
import MediaReplaceFlow from '../media-replace-flow';
import { store as blockEditorStore } from '../../store';

const IMAGE_BACKGROUND_TYPE = 'image';

const BACKGROUND_POPOVER_PROPS = {
	placement: 'left-start',
	offset: 36,
	shift: true,
};

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
	return __( 'Specify a fixed width.' );
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

function InspectorImagePreviewToggle( {
	label,
	filename,
	url: imgUrl,
	children,
	allowPopover = false,
} ) {
	const imgLabel = label || getFilename( imgUrl );
	// @TODO abstract
	if ( ! allowPopover ) {
		return (
			<ItemGroup
				as="span"
				className="block-editor-global-styles-background-panel__image-preview"
			>
				<HStack
					justify="flex-start"
					as="span"
					className="block-editor-global-styles-background-panel__image-preview-content"
				>
					<span
						className={ classnames(
							'block-editor-global-styles-background-panel__inspector-image-indicator-wrapper',
							{
								'has-image': imgUrl,
							}
						) }
						aria-hidden
					>
						{ imgUrl && (
							<span
								className="block-editor-global-styles-background-panel__inspector-image-indicator"
								style={ {
									backgroundImage: `url(${ imgUrl })`,
								} }
							/>
						) }
					</span>
					<FlexItem as="span">
						<Truncate
							numberOfLines={ 1 }
							className="block-editor-global-styles-background-panel__inspector-media-replace-title"
						>
							{ imgLabel }
						</Truncate>
						<VisuallyHidden as="span">
							{ filename
								? sprintf(
										/* translators: %s: file name */
										__( 'Selected image: %s' ),
										filename
								  )
								: __( 'No image selected' ) }
						</VisuallyHidden>
					</FlexItem>
				</HStack>
			</ItemGroup>
		);
	}
	return (
		<Dropdown
			popoverProps={ BACKGROUND_POPOVER_PROPS }
			className="block-editor-global-styles-background-panel__inspector-media-replace"
			renderToggle={ ( { onToggle, isOpen } ) => {
				const toggleProps = {
					onClick: onToggle,
					className: classnames(
						'block-editor-global-styles-background-panel__dropdown-toggle',
						{ 'is-open': isOpen }
					),
					'aria-expanded': isOpen,
					'aria-label': __(
						'Background size, position and repeat options.'
					),
				};
				return (
					<ItemGroup as="button" { ...toggleProps }>
						<HStack justify="flex-start" as="span">
							<span
								className={ classnames(
									'block-editor-global-styles-background-panel__inspector-image-indicator-wrapper',
									{
										'has-image': imgUrl,
									}
								) }
								aria-hidden
							>
								{ imgUrl && (
									<span
										className="block-editor-global-styles-background-panel__inspector-image-indicator"
										style={ {
											backgroundImage: `url(${ imgUrl })`,
										} }
									/>
								) }
							</span>
							<FlexItem as="span">
								<Truncate
									numberOfLines={ 1 }
									className="block-editor-global-styles-background-panel__inspector-media-replace-title"
								>
									{ imgLabel }
								</Truncate>
								<VisuallyHidden as="span">
									{ filename
										? sprintf(
												/* translators: %s: file name */
												__( 'Selected image: %s' ),
												filename
										  )
										: __( 'No image selected' ) }
								</VisuallyHidden>
							</FlexItem>
						</HStack>
					</ItemGroup>
				);
			} }
			renderContent={ ( { onClose } ) => (
				<DropdownContentWrapper>{ children }</DropdownContentWrapper>
			) }
		/>
	);
}

function InspectorImagePreview( {
	label,
	title,
	url: imgUrl,
	//as = 'span',
	//className = 'block-editor-global-styles-background-panel__image-preview',
	...otherProps
} ) {
	const imgLabel = label || getFilename( imgUrl ) || __( 'Add image' );
	const filename = title || __( 'Unitled' );
	return (
		<ItemGroup { ...otherProps }>
			<HStack justify="flex-start" as="span">
				<span
					className={ classnames(
						'block-editor-global-styles-background-panel__inspector-image-indicator-wrapper',
						{
							'has-image': imgUrl,
						}
					) }
					aria-hidden
				>
					{ imgUrl && (
						<span
							className="block-editor-global-styles-background-panel__inspector-image-indicator"
							style={ {
								backgroundImage: `url(${ imgUrl })`,
							} }
						/>
					) }
				</span>
				<FlexItem as="span">
					<Truncate
						numberOfLines={ 1 }
						className="block-editor-global-styles-background-panel__inspector-media-replace-title"
					>
						{ imgLabel }
					</Truncate>
					<VisuallyHidden as="span">
						{ filename
							? sprintf(
									/* translators: %s: file name */
									__( 'Selected image: %s' ),
									filename
							  )
							: __( 'No image selected' ) }
					</VisuallyHidden>
				</FlexItem>
			</HStack>
		</ItemGroup>
	);
}

function BackgroundImageControls( {
	hasImageValue,
	settings,
	url,
	title,
	children,
} ) {
	const shouldShowBackgroundSizeControls =
		hasImageValue &&
		( settings?.background?.backgroundSize ||
			settings?.background?.backgroundPosition ||
			settings?.background?.backgroundRepeat );

	if ( ! shouldShowBackgroundSizeControls ) {
		return (
			<InspectorImagePreview
				label={ title }
				url={ url }
				as="span"
				className="block-editor-global-styles-background-panel__image-preview"
			/>
		);
	}

	return (
		<Dropdown
			popoverProps={ BACKGROUND_POPOVER_PROPS }
			className="block-editor-global-styles-background-panel__inspector-media-replace"
			renderToggle={ ( { onToggle, isOpen } ) => {
				const toggleProps = {
					onClick: onToggle,
					className: classnames(
						'block-editor-global-styles-background-panel__dropdown-toggle',
						{ 'is-open': isOpen }
					),
					'aria-expanded': isOpen,
					'aria-label': __(
						'Background size, position and repeat options.'
					),
				};
				return (
					<InspectorImagePreview
						label={ title }
						filename={ title }
						url={ url }
						as={ 'button' }
						{ ...toggleProps }
					/>
				);
			} }
			renderContent={ () => (
				<DropdownContentWrapper>{ children }</DropdownContentWrapper>
			) }
		/>
	);
}

function BackgroundImageToolsPanelItem( {
	panelId,
	defaultControls,
	onChange,
	style,
	inheritedValue,
	defaultValues,
	settings,
} ) {
	const mediaUpload = useSelect(
		( select ) => select( blockEditorStore ).getSettings().mediaUpload,
		[]
	);

	const { id, title, url } = style?.background?.backgroundImage || {
		...inheritedValue?.background?.backgroundImage,
	};

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

		onChange(
			setImmutably( style, [ 'background', 'backgroundImage' ], {
				url: media.url,
				id: media.id,
				source: 'file',
				title: media.title || undefined,
			} )
		);
	};

	const onFilesDrop = ( filesList ) => {
		mediaUpload( {
			allowedTypes: [ 'image' ],
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

	const hasValue =
		hasBackgroundImageValue( style ) ||
		hasBackgroundImageValue( inheritedValue );

	const shouldShowBackgroundImageControls =
		hasValue &&
		( settings?.background?.backgroundSize ||
			settings?.background?.backgroundPosition ||
			settings?.background?.backgroundRepeat );

	return (
		<ToolsPanelItem
			className="single-column"
			hasValue={ () => hasValue }
			label={ __( 'Background image' ) }
			onDeselect={ resetBackgroundImage }
			isShownByDefault={ defaultControls.backgroundImage }
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
					name={ <Icon icon={ reusableBlock } /> }
					variant="secondary"
				>
					{ hasValue && (
						<MenuItem
							onClick={ () => {
								const [ toggleButton ] = focus.tabbable.find(
									replaceContainerRef.current
								);
								// Focus the toggle button and close the dropdown menu.
								// This ensures similar behaviour as to selecting an image, where the dropdown is
								// closed and focus is redirected to the dropdown toggle button.
								toggleButton?.focus();
								toggleButton?.click();
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
	panelId,
	onChange,
	style,
	inheritedValue,
	defaultValues,
	defaultControls,
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

	const hasValue = hasBackgroundSizeValue( style );

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			style: {
				...previousValue.style,
				background: {
					...previousValue.style?.background,
					backgroundRepeat: undefined,
					backgroundSize: undefined,
				},
			},
		};
	}, [] );

	const updateBackgroundSize = ( next ) => {
		// When switching to 'contain' toggle the repeat off.
		let nextRepeat = repeatValue;

		if ( next === 'contain' ) {
			nextRepeat = 'no-repeat';
		}

		if ( next === 'cover' ) {
			nextRepeat = undefined;
		}

		if (
			( currentValueForToggle === 'cover' ||
				currentValueForToggle === 'contain' ) &&
			next === 'auto'
		) {
			nextRepeat = undefined;
		}

		onChange(
			setImmutably( style, [ 'background' ], {
				...style?.background,
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
				repeatCheckedValue === true ? 'no-repeat' : undefined
			)
		);

	const resetBackgroundSize = () =>
		onChange(
			setImmutably( style, [ 'background' ], {
				...style?.background,
				backgroundPosition: undefined,
				backgroundRepeat: undefined,
				backgroundSize: undefined,
			} )
		);

	return (
		<VStack spacing={ 2 } className="single-column">
			<FocalPointPicker
				__next40pxDefaultSize
				label={ __( 'Position' ) }
				url={ imageValue }
				value={ backgroundPositionToCoords( positionValue ) }
				onChange={ updateBackgroundPosition }
			/>
			<ToggleGroupControl
				size={ '__unstable-large' }
				label={ __( 'Size' ) }
				value={ currentValueForToggle }
				onChange={ updateBackgroundSize }
				isBlock
				help={ backgroundSizeHelpText( sizeValue ) }
			>
				<ToggleGroupControlOption
					key={ 'cover' }
					value={ 'cover' }
					label={ __( 'Cover' ) }
				/>
				<ToggleGroupControlOption
					key={ 'contain' }
					value={ 'contain' }
					label={ __( 'Contain' ) }
				/>
				<ToggleGroupControlOption
					key={ 'fixed' }
					value={ 'auto' }
					label={ __( 'Fixed' ) }
				/>
			</ToggleGroupControl>
			{ sizeValue !== undefined &&
			sizeValue !== 'cover' &&
			sizeValue !== 'contain' ? (
				<UnitControl
					size={ '__unstable-large' }
					onChange={ updateBackgroundSize }
					value={ sizeValue }
				/>
			) : null }
			{ currentValueForToggle !== 'cover' && (
				<ToggleControl
					label={ __( 'Repeat' ) }
					checked={ repeatCheckedValue }
					onChange={ toggleIsRepeated }
				/>
			) }
		</VStack>
	);
}

function BackgroundToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
} ) {
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<VStack
			as={ ToolsPanel }
			spacing={ 6 }
			label={ __( 'Background' ) }
			resetAll={ resetAll }
			panelId={ panelId }
			dropdownMenuProps={ TOOLSPANEL_DROPDOWNMENU_PROPS }
		>
			{ children }
		</VStack>
	);
}

const DEFAULT_CONTROLS = {
	backgroundImage: true,
	backgroundSize: false,
};

export default function BackgroundPanel( {
	as: Wrapper = BackgroundToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
	defaultValues = {},
} ) {
	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			background: {},
		};
	}, [] );

	const { id, title, url } = value?.background?.backgroundImage || {
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

	const backgroundSizeResetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			style: {
				...previousValue.style,
				background: {
					...previousValue.style?.background,
					backgroundRepeat: undefined,
					backgroundSize: undefined,
				},
			},
		};
	}, [] );


	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
		>
			<div className="block-editor-global-styles-background-panel__inspector-media-replace-container">
				<InspectorImagePreviewToggle
					label={ __( 'Background image' ) }
					filename={ title || __( 'Untitled' ) }
					url={ url }
					allowPopover={ shouldShowBackgroundImageControls }
				>
					<BackgroundSizeToolsPanelItem
						onChange={ onChange }
						panelId={ panelId }
						defaultControls={ defaultControls }
						style={ value }
						inheritedValue={ inheritedValue }
						defaultValues={ defaultValues }
					/>
				</InspectorImagePreviewToggle>
				<BackgroundImageToolsPanelItem
					onChange={ onChange }
					panelId={ panelId }
					defaultControls={ defaultControls }
					style={ value }
					inheritedValue={ inheritedValue }
					defaultValues={ defaultValues }
					settings={ settings }
				/>
				{/*Dummy toolspanel items so we can control what's in the dropdown popover*/}
				<ToolsPanelItem
					hasValue={ () => hasSizeValue }
					label={ __( 'Size' ) }
					onDeselect={ resetBackgroundSize }
					resetAllFilter={ backgroundSizeResetAllFilter }
					isShownByDefault={ defaultControls.backgroundSize }
					panelId={ panelId }
				/>
			</div>
		</Wrapper>
	);
}
