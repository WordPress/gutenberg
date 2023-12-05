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
	__experimentalToolsPanelItem as ToolsPanelItem,
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
import { pure } from '@wordpress/compose';

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
		return !! support?.backgroundImage;
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

function BackgroundImagePanelItem( { clientId, setAttributes } ) {
	const style = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockAttributes( clientId )?.style,
		[ clientId ]
	);
	const { id, title, url } = style?.background?.backgroundImage || {};

	const replaceContainerRef = useRef();

	const { mediaUpload } = useSelect( ( select ) => {
		return {
			mediaUpload: select( blockEditorStore ).getSettings().mediaUpload,
		};
	} );

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
			isShownByDefault={ true }
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

function BackgroundImagePanelPure( props ) {
	const [ backgroundImage ] = useSettings( 'background.backgroundImage' );
	if (
		! backgroundImage ||
		! hasBackgroundSupport( props.name, 'backgroundImage' )
	) {
		return null;
	}

	return (
		<InspectorControls group="background">
			<BackgroundImagePanelItem { ...props } />
		</InspectorControls>
	);
}

export const BackgroundImagePanel = pure( BackgroundImagePanelPure );
