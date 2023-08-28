/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import { getBlockSupport } from '@wordpress/blocks';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	Button,
	DropZone,
	FlexItem,
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { Platform, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { getFilename } from '@wordpress/url';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import MediaReplaceFlow from '../components/media-replace-flow';
import MediaUpload from '../components/media-upload';
import MediaUploadCheck from '../components/media-upload/check';
import useSetting from '../components/use-setting';
import { cleanEmptyObject } from './utils';
import { store as blockEditorStore } from '../store';

export const BACKGROUND_IMAGE_SUPPORT_KEY = '__experimentalBackgroundImage';
export const MEDIA_SUPPORT_KEY = 'media';
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
		!! props.attributes.style?.media?.backgroundImage?.id ||
		!! props.attributes.style?.media?.backgroundImage?.url;

	return hasValue;
}

/**
 * Determine whether there is block support for background image.
 *
 * @param {string} blockName Block name.
 * @param {string} feature   Background image feature to check for.
 *
 * @return {boolean} Whether there is support.
 */
export function hasMediaSupport( blockName, feature = 'any' ) {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	const support = getBlockSupport( blockName, MEDIA_SUPPORT_KEY );

	if ( support === true ) {
		return true;
	}

	return !! support?.[ feature ];
}

/**
 * Resets the position block support attributes. This can be used when disabling
 * the position support controls for a block via a `ToolsPanel`.
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
			media: {
				...style?.media,
				backgroundImage: undefined,
			},
		} ),
	} );
}

function InspectorImagePreview( { url: imgUrl } ) {
	const imgLabel = getFilename( imgUrl );
	return (
		<ItemGroup as="span">
			<HStack justify="flex-start" as="span">
				<img src={ imgUrl } alt="" />
				<FlexItem as="span">
					<Truncate
						numberOfLines={ 1 }
						className="block-editor-hooks__media__inspector-media-replace-title"
					>
						{ imgLabel }
					</Truncate>
				</FlexItem>
			</HStack>
		</ItemGroup>
	);
}

function BackgroundImagePanelItem( props ) {
	const { attributes, clientId, setAttributes } = props;

	const { id, url } = attributes.style?.media?.backgroundImage || {};

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
				media: {
					...attributes.style?.media,
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
			// TODO: Might need to revoke the blob URL.
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
			media: {
				...attributes.style?.media,
				backgroundImage: {
					url: media.url,
					id: media.id,
					source: 'file',
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
				media: undefined,
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
			<div className="block-editor-hooks__media__inspector-media-replace-container">
				{ !! url && (
					<MediaReplaceFlow
						mediaId={ id }
						mediaURL={ url }
						allowedTypes={ [ IMAGE_BACKGROUND_TYPE ] }
						accept="image/*"
						onSelect={ onSelectMedia }
						name={ <InspectorImagePreview url={ url } /> }
						variant="secondary"
					/>
				) }
				{ ! url && (
					<MediaUploadCheck>
						<MediaUpload
							onSelect={ onSelectMedia }
							allowedTypes={ [ IMAGE_BACKGROUND_TYPE ] }
							render={ ( { open } ) => (
								<div className="block-editor-hooks__media____inspector-upload-container">
									<Button
										onClick={ open }
										variant="secondary"
									>
										{ __( 'Add background image' ) }
									</Button>
									<DropZone onFilesDrop={ onFilesDrop } />
								</div>
							) }
						/>
					</MediaUploadCheck>
				) }
			</div>
		</ToolsPanelItem>
	);
}

export function MediaPanel( props ) {
	const isBackgroundImageSupported =
		useSetting( 'media.backgroundImage' ) &&
		hasMediaSupport( props.name, 'backgroundImage' );

	const isDisabled = [ ! isBackgroundImageSupported ].every( Boolean );

	if ( isDisabled ) {
		return null;
	}

	return (
		<InspectorControls group="media">
			{ isBackgroundImageSupported && (
				<BackgroundImagePanelItem { ...props } />
			) }
		</InspectorControls>
	);
}
