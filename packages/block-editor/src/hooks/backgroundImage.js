/**
 * WordPress dependencies
 */
import { getBlobTypeByURL, isBlobURL } from '@wordpress/blob';
import { getBlockSupport } from '@wordpress/blocks';
import { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import MediaReplaceFlow from '../components/media-replace-flow';

import useSetting from '../components/use-setting';
import { cleanEmptyObject } from './utils';

export const BACKGROUND_IMAGE_SUPPORT_KEY = '__experimentalBackgroundImage';
export const IMAGE_BACKGROUND_TYPE = 'image';

export function BackgroundImagePanel( props ) {
	const { attributes, clientId, setAttributes } = props;

	const { id, url } = attributes.style?.backgroundImage || {};

	const onSelectMedia = ( media ) => {
		if ( ! media || ! media.url ) {
			setAttributes( { url: undefined, id: undefined } );
			return;
		}

		if ( isBlobURL( media.url ) ) {
			media.type = getBlobTypeByURL( media.url );
		}

		// For media selections originated from a file upload.
		if ( media.media_type && media.media_type !== IMAGE_BACKGROUND_TYPE ) {
			return;
		} else if ( media.type !== IMAGE_BACKGROUND_TYPE ) {
			// For media selections originated from existing files in the media library.
			return;
		}

		const newStyle = {
			...attributes.style,
			backgroundImage: {
				...attributes.style?.backgroundImage,
				...{
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

	const isBackgroundImageSupported =
		useSetting( 'backgroundImage' ) &&
		hasBackgroundImageSupport( props.name );

	const isDisabled = [ ! isBackgroundImageSupported ].every( Boolean );

	if ( isDisabled ) {
		return null;
	}

	const createResetAllFilter = (
		backgroundImageAttributes,
		topLevelAttributes = {}
	) => ( newAttributes ) => ( {
		...newAttributes,
		...topLevelAttributes,
		style: removeBackgroundImageAttributes(
			newAttributes.style,
			backgroundImageAttributes
		),
	} );

	return (
		<InspectorControls __experimentalGroup="backgroundImage">
			{ isBackgroundImageSupported && (
				<ToolsPanelItem
					className="single-column"
					hasValue={ () => hasBackgroundImageValue( props ) }
					label={ __( 'Image' ) }
					onDeselect={ () => resetBackgroundImage( props ) }
					isShownByDefault={ true }
					resetAllFilter={ createResetAllFilter( [ 'url', 'id' ] ) }
					panelId={ clientId }
				>
					<MediaReplaceFlow
						mediaId={ id }
						mediaURL={ url }
						allowedTypes={ [ 'image' ] }
						accept="image/*"
						onSelect={ onSelectMedia }
						name={ ! url ? __( 'Add Media' ) : __( 'Replace' ) }
						variant="secondary"
					/>
				</ToolsPanelItem>
			) }
		</InspectorControls>
	);
}

/**
 * Checks if there is a current value in the background image block support
 * attributes.
 *
 * @param {Object} props Block props.
 * @return {boolean}     Whether or not the block has a background image value set.
 */
export function hasBackgroundImageValue( props ) {
	const hasValue =
		!! props.attributes.style?.backgroundImage?.id ||
		!! props.attributes.style?.backgroundImage?.url;

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
export function hasBackgroundImageSupport( blockName, feature = 'any' ) {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	const support = getBlockSupport( blockName, BACKGROUND_IMAGE_SUPPORT_KEY );

	if ( support === true ) {
		return true;
	}

	return !! support?.[ feature ];
}

/**
 * Check whether serialization of background image classes and styles should be skipped.
 *
 * @param {string|Object} blockType Block name or block type object.
 *
 * @return {boolean} Whether serialization of border properties should occur.
 */
export function shouldSkipSerialization( blockType ) {
	const support = getBlockSupport( blockType, BACKGROUND_IMAGE_SUPPORT_KEY );

	return support?.__experimentalSkipSerialization;
}

export function resetBackgroundImage( { attributes = {}, setAttributes } ) {
	const { style } = attributes;
	setAttributes( {
		style: removeBackgroundImageAttributes( style, [ 'url', 'id' ] ),
	} );
}

/**
 * Returns a new style object where the specified border attribute has been
 * removed.
 *
 * @param {Object} style      Styles from block attributes.
 * @param {string} attributes The background image style attributes to clear.
 *
 * @return {Object} Style object with the specified attribute removed.
 */
export function removeBackgroundImageAttributes( style, attributes ) {
	const clearedAttributes = {};
	attributes?.forEach(
		( attribute ) => ( clearedAttributes[ attribute ] = undefined )
	);
	return cleanEmptyObject( {
		...style,
		backgroundImage: {
			...style?.backgroundImage,
			...clearedAttributes,
		},
	} );
}
