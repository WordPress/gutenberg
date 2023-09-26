/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import { getBlockSupport } from '@wordpress/blocks';
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
import { Platform, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { getFilename } from '@wordpress/url';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import MediaReplaceFlow from '../components/media-replace-flow';
import useSetting from '../components/use-setting';
import { cleanEmptyObject } from './utils';
import { store as blockEditorStore } from '../store';

export const BACKGROUND_SUPPORT_KEY = 'background';
export const IMAGE_BACKGROUND_TYPE = 'image';

/**
 * Checks if there is a current value in the background image block support
 * attributes.
 *
 * @param {Object} props Block props.
 * @return {boolean}     Whether or not the block has a background image value set.
 */
export function hasBackgroundImageValue( props ) {
	const hasValue =
		!! props.attributes.style?.background?.backgroundImage?.id ||
		!! props.attributes.style?.background?.backgroundImage?.url;

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
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetBackgroundImage( { attributes = {}, setAttributes } ) {
	const { style = {} } = attributes;

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

function BackgroundImagePanelItem( props ) {
	const { attributes, clientId, setAttributes } = props;

	const { id, title, url } =
		attributes.style?.background?.backgroundImage || {};

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
				...attributes.style,
				background: {
					...attributes.style?.background,
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
			...attributes.style,
			background: {
				...attributes.style?.background,
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

	return (
		<ToolsPanelItem
			className="single-column"
			hasValue={ () => hasBackgroundImageValue( props ) }
			label={ __( 'Background image' ) }
			onDeselect={ () => resetBackgroundImage( props ) }
			isShownByDefault={ true }
			resetAllFilter={ resetAllFilter }
			panelId={ clientId }
		>
			<div className="block-editor-hooks__background__inspector-media-replace-container">
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
					<MenuItem onClick={ () => resetBackgroundImage( props ) }>
						{ __( 'Reset ' ) }
					</MenuItem>
				</MediaReplaceFlow>
				<DropZone
					onFilesDrop={ onFilesDrop }
					label={ __( 'Drop to upload' ) }
				/>
			</div>
		</ToolsPanelItem>
	);
}

export function BackgroundImagePanel( props ) {
	const isBackgroundImageSupported =
		useSetting( 'background.backgroundImage' ) &&
		hasBackgroundSupport( props.name, 'backgroundImage' );

	if ( ! isBackgroundImageSupported ) {
		return null;
	}

	return (
		<InspectorControls group="background">
			{ isBackgroundImageSupported && (
				<BackgroundImagePanelItem { ...props } />
			) }
		</InspectorControls>
	);
}
