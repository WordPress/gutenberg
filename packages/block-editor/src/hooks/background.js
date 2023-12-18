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
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalUnitControl as UnitControl,
	__experimentalVStack as VStack,
	DropZone,
	FlexItem,
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
 * attributes.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether or not the block has a background size value set.
 */
export function hasBackgroundSizeValue( style ) {
	return style?.background?.backgroundSize !== undefined;
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
		return !! support?.backgroundImage || !! support?.backgroundSize;
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
export function resetBackgroundSize( style = {}, setAttributes ) {
	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			background: {
				...style?.background,
				backgroundSize: undefined,
			},
		} ),
	} );
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
		return __( 'Stretch image to cover the block.' );
	}
	if ( value === 'contain' ) {
		return __( 'Image is contained within the block.' );
	}
	return __( 'Repeat the image, and set a fixed size.' );
}

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

	const value = style?.background?.backgroundSize;

	const hasValue = hasBackgroundSizeValue( style );

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			style: {
				...previousValue.style,
				background: {
					...previousValue.style?.background,
					backgroundSize: undefined,
				},
			},
		};
	}, [] );

	const updateBackgroundSize = ( next ) => {
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				background: {
					...style?.background,
					backgroundSize: next,
				},
			} ),
		} );
	};

	// An `undefined` value is treated as `cover` by the toggle group control.
	// An empty string is treated as `auto` by the toggle group control. This
	// allows a user to select "Size" and then enter a custom value, with an
	// empty value being treated as `auto`.
	const currentValueForToggle =
		( value !== undefined && value !== 'cover' && value !== 'contain' ) ||
		value === ''
			? 'auto'
			: value || 'cover';

	return (
		<VStack
			as={ ToolsPanelItem }
			spacing={ 2 }
			className="single-column"
			hasValue={ () => hasValue }
			label={ __( 'Background size' ) }
			onDeselect={ () => resetBackgroundSize( style, setAttributes ) }
			isShownByDefault={ isShownByDefault }
			resetAllFilter={ resetAllFilter }
			panelId={ clientId }
		>
			<ToggleGroupControl
				__nextHasNoMarginBottom
				size={ '__unstable-large' }
				label={ __( 'Background size' ) }
				value={ currentValueForToggle }
				onChange={ updateBackgroundSize }
				isBlock={ true }
				help={ backgroundSizeHelpText( value ) }
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
					key={ 'size' }
					value={ 'auto' }
					label={ __( 'Size' ) }
				/>
			</ToggleGroupControl>
			{ value !== undefined &&
			value !== 'cover' &&
			value !== 'contain' ? (
				<UnitControl
					size={ '__unstable-large' }
					onChange={ updateBackgroundSize }
					value={ value }
				/>
			) : null }
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
