/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import { getBlockSupport } from '@wordpress/blocks';
import { focus } from '@wordpress/dom';
import {
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToolsPanelItem as ToolsPanelItem,
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
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { Platform, useCallback, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { getFilename } from '@wordpress/url';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import MediaReplaceFlow from '../components/media-replace-flow';
import { useSettings } from '../components/use-settings';
import { cleanEmptyObject } from './utils';
import { store as blockEditorStore } from '../store';

export const BACKGROUND_SUPPORT_KEY = 'background';
export const IMAGE_BACKGROUND_TYPE = 'image';

/**
 * Checks if there is a current value in the background image block support
 * attributes.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether or not the block has a background image value set.
 */
export function hasBackgroundImageValue( style ) {
	const hasValue =
		!! style?.background?.backgroundImage?.id ||
		!! style?.background?.backgroundImage?.url;

	return hasValue;
}

/**
 * Checks if there is a current value in the background size block support
 * attributes. Background size values include background size as well
 * as background position.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether or not the block has a background size value set.
 */
export function hasBackgroundSizeValue( style ) {
	return (
		style?.background?.backgroundPosition !== undefined ||
		style?.background?.backgroundSize !== undefined
	);
}

/**
 * Determine whether there is block support for background.
 *
 * @param {string} blockName Block name.
 * @param {string} feature   Background image feature to check for.
 *
 * @return {boolean} Whether there is support.
 */
export function hasBackgroundSupport( blockName, feature = 'any' ) {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	const support = getBlockSupport( blockName, BACKGROUND_SUPPORT_KEY );

	if ( support === true ) {
		return true;
	}

	if ( feature === 'any' ) {
		return (
			!! support?.backgroundImage ||
			!! support?.backgroundSize ||
			!! support?.backgroundRepeat
		);
	}

	return !! support?.[ feature ];
}

/**
 * Resets the background image block support attributes. This can be used when disabling
 * the background image controls for a block via a `ToolsPanel`.
 *
 * @param {Object}   style         Style attribute.
 * @param {Function} setAttributes Function to set block's attributes.
 */
export function resetBackgroundImage( style = {}, setAttributes ) {
	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			background: {
				...style?.background,
				backgroundImage: undefined,
			},
		} ),
	} );
}

/**
 * Resets the background size block support attributes. This can be used when disabling
 * the background size controls for a block via a `ToolsPanel`.
 *
 * @param {Object}   style         Style attribute.
 * @param {Function} setAttributes Function to set block's attributes.
 */
function resetBackgroundSize( style = {}, setAttributes ) {
	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			background: {
				...style?.background,
				backgroundPosition: undefined,
				backgroundRepeat: undefined,
				backgroundSize: undefined,
			},
		} ),
	} );
}

/**
 * Generates a CSS class name if an background image is set.
 *
 * @param {Object} style A block's style attribute.
 *
 * @return {string} CSS class name.
 */
export function getBackgroundImageClasses( style ) {
	return hasBackgroundImageValue( style ) ? 'has-background' : '';
}

function InspectorImagePreview( { label, filename, url: imgUrl } ) {
	const imgLabel = label || getFilename( imgUrl );
	return (
		<ItemGroup as="span">
			<HStack justify="flex-start" as="span">
				<span
					className={ classnames(
						'block-editor-hooks__background__inspector-image-indicator-wrapper',
						{
							'has-image': imgUrl,
						}
					) }
					aria-hidden
				>
					{ imgUrl && (
						<span
							className="block-editor-hooks__background__inspector-image-indicator"
							style={ {
								backgroundImage: `url(${ imgUrl })`,
							} }
						/>
					) }
				</span>
				<FlexItem as="span">
					<Truncate
						numberOfLines={ 1 }
						className="block-editor-hooks__background__inspector-media-replace-title"
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

function BackgroundImagePanelItem( {
	clientId,
	isShownByDefault,
	setAttributes,
} ) {
	const { style, mediaUpload } = useSelect(
		( select ) => {
			const { getBlockAttributes, getSettings } =
				select( blockEditorStore );

			return {
				style: getBlockAttributes( clientId )?.style,
				mediaUpload: getSettings().mediaUpload,
			};
		},
		[ clientId ]
	);
	const { id, title, url } = style?.background?.backgroundImage || {};

	const replaceContainerRef = useRef();

	const { createErrorNotice } = useDispatch( noticesStore );
	const onUploadError = ( message ) => {
		createErrorNotice( message, { type: 'snackbar' } );
	};

	const onSelectMedia = ( media ) => {
		if ( ! media || ! media.url ) {
			const newStyle = {
				...style,
				background: {
					...style?.background,
					backgroundImage: undefined,
				},
			};

			const newAttributes = {
				style: cleanEmptyObject( newStyle ),
			};

			setAttributes( newAttributes );
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

		const newStyle = {
			...style,
			background: {
				...style?.background,
				backgroundImage: {
					url: media.url,
					id: media.id,
					source: 'file',
					title: media.title || undefined,
				},
			},
		};

		const newAttributes = {
			style: cleanEmptyObject( newStyle ),
		};

		setAttributes( newAttributes );
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

	const hasValue = hasBackgroundImageValue( style );

	return (
		<ToolsPanelItem
			className="single-column"
			hasValue={ () => hasValue }
			label={ __( 'Background image' ) }
			onDeselect={ () => resetBackgroundImage( style, setAttributes ) }
			isShownByDefault={ isShownByDefault }
			resetAllFilter={ resetAllFilter }
			panelId={ clientId }
		>
			<div
				className="block-editor-hooks__background__inspector-media-replace-container"
				ref={ replaceContainerRef }
			>
				<MediaReplaceFlow
					mediaId={ id }
					mediaURL={ url }
					allowedTypes={ [ IMAGE_BACKGROUND_TYPE ] }
					accept="image/*"
					onSelect={ onSelectMedia }
					name={
						<InspectorImagePreview
							label={ __( 'Background image' ) }
							filename={ title }
							url={ url }
						/>
					}
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
								resetBackgroundImage( style, setAttributes );
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

function backgroundSizeHelpText( value ) {
	if ( value === 'cover' || value === undefined ) {
		return __( 'Image covers the space evenly.' );
	}
	if ( value === 'contain' ) {
		return __( 'Image is contained without distortion.' );
	}
	return __( 'Specify a fixed width.' );
}

export const coordsToBackgroundPosition = ( value ) => {
	if ( ! value || isNaN( value.x ) || isNaN( value.y ) ) {
		return undefined;
	}

	return `${ value.x * 100 }% ${ value.y * 100 }%`;
};

export const backgroundPositionToCoords = ( value ) => {
	if ( ! value ) {
		return { x: undefined, y: undefined };
	}

	let [ x, y ] = value.split( ' ' ).map( ( v ) => parseFloat( v ) / 100 );
	x = isNaN( x ) ? undefined : x;
	y = isNaN( y ) ? x : y;

	return { x, y };
};

function BackgroundSizePanelItem( {
	clientId,
	isShownByDefault,
	setAttributes,
} ) {
	const style = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockAttributes( clientId )?.style,
		[ clientId ]
	);

	const sizeValue = style?.background?.backgroundSize;
	const repeatValue = style?.background?.backgroundRepeat;

	// An `undefined` value is treated as `cover` by the toggle group control.
	// An empty string is treated as `auto` by the toggle group control. This
	// allows a user to select "Size" and then enter a custom value, with an
	// empty value being treated as `auto`.
	const currentValueForToggle =
		( sizeValue !== undefined &&
			sizeValue !== 'cover' &&
			sizeValue !== 'contain' ) ||
		sizeValue === ''
			? 'auto'
			: sizeValue || 'cover';

	// If the current value is `cover` and the repeat value is `undefined`, then
	// the toggle should be unchecked as the default state. Otherwise, the toggle
	// should reflect the current repeat value.
	const repeatCheckedValue =
		repeatValue === 'no-repeat' ||
		( currentValueForToggle === 'cover' && repeatValue === undefined )
			? false
			: true;

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

		if (
			( currentValueForToggle === 'cover' ||
				currentValueForToggle === 'contain' ) &&
			next === 'auto'
		) {
			nextRepeat = undefined;
		}

		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				background: {
					...style?.background,
					backgroundRepeat: nextRepeat,
					backgroundSize: next,
				},
			} ),
		} );
	};

	const updateBackgroundPosition = ( next ) => {
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				background: {
					...style?.background,
					backgroundPosition: coordsToBackgroundPosition( next ),
				},
			} ),
		} );
	};

	const toggleIsRepeated = () => {
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				background: {
					...style?.background,
					backgroundRepeat:
						repeatCheckedValue === true ? 'no-repeat' : undefined,
				},
			} ),
		} );
	};

	return (
		<VStack
			as={ ToolsPanelItem }
			spacing={ 2 }
			className="single-column"
			hasValue={ () => hasValue }
			label={ __( 'Size' ) }
			onDeselect={ () => resetBackgroundSize( style, setAttributes ) }
			isShownByDefault={ isShownByDefault }
			resetAllFilter={ resetAllFilter }
			panelId={ clientId }
		>
			<FocalPointPicker
				__next40pxDefaultSize
				label={ __( 'Position' ) }
				url={ style?.background?.backgroundImage?.url }
				value={ backgroundPositionToCoords(
					style?.background?.backgroundPosition
				) }
				onChange={ updateBackgroundPosition }
			/>
			<ToggleGroupControl
				size={ '__unstable-large' }
				label={ __( 'Size' ) }
				value={ currentValueForToggle }
				onChange={ updateBackgroundSize }
				isBlock={ true }
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

export function BackgroundImagePanel( props ) {
	const [ backgroundImage, backgroundSize ] = useSettings(
		'background.backgroundImage',
		'background.backgroundSize'
	);

	if (
		! backgroundImage ||
		! hasBackgroundSupport( props.name, 'backgroundImage' )
	) {
		return null;
	}

	const showBackgroundSize = !! (
		backgroundSize && hasBackgroundSupport( props.name, 'backgroundSize' )
	);

	const defaultControls = getBlockSupport( props.name, [
		BACKGROUND_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );

	return (
		<InspectorControls group="background">
			<BackgroundImagePanelItem
				isShownByDefault={ defaultControls?.backgroundImage }
				{ ...props }
			/>
			{ showBackgroundSize && (
				<BackgroundSizePanelItem
					isShownByDefault={ defaultControls?.backgroundSize }
					{ ...props }
				/>
			) }
		</InspectorControls>
	);
}
