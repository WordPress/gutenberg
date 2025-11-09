/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

import {
	BlockControls,
	MediaReplaceFlow,
	__experimentalBlockAlignmentMatrixControl as BlockAlignmentMatrixControl,
	__experimentalBlockFullHeightAligmentControl as FullHeightAlignmentControl,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { link } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ALLOWED_MEDIA_TYPES } from '../shared';
import { unlock } from '../../lock-unlock';
import EmbedVideoUrlInput from './embed-video-url-input';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

export default function CoverBlockControls( {
	attributes,
	setAttributes,
	onSelectMedia,
	currentSettings,
	toggleUseFeaturedImage,
	onClearMedia,
	onSelectEmbedUrl,
	blockEditingMode,
} ) {
	const { contentPosition, id, useFeaturedImage, minHeight, minHeightUnit } =
		attributes;
	const { hasInnerBlocks, url } = currentSettings;

	const [ prevMinHeightValue, setPrevMinHeightValue ] = useState( minHeight );
	const [ prevMinHeightUnit, setPrevMinHeightUnit ] =
		useState( minHeightUnit );
	const [ isEmbedUrlInputOpen, setIsEmbedUrlInputOpen ] = useState( false );
	const isMinFullHeight =
		minHeightUnit === 'vh' &&
		minHeight === 100 &&
		! attributes?.style?.dimensions?.aspectRatio;
	const isContentOnlyMode = blockEditingMode === 'contentOnly';

	const toggleMinFullHeight = () => {
		if ( isMinFullHeight ) {
			// If there aren't previous values, take the default ones.
			if ( prevMinHeightUnit === 'vh' && prevMinHeightValue === 100 ) {
				return setAttributes( {
					minHeight: undefined,
					minHeightUnit: undefined,
				} );
			}

			// Set the previous values of height.
			return setAttributes( {
				minHeight: prevMinHeightValue,
				minHeightUnit: prevMinHeightUnit,
			} );
		}

		setPrevMinHeightValue( minHeight );
		setPrevMinHeightUnit( minHeightUnit );

		// Set full height, and clear any aspect ratio value.
		return setAttributes( {
			minHeight: 100,
			minHeightUnit: 'vh',
			style: cleanEmptyObject( {
				...attributes?.style,
				dimensions: {
					...attributes?.style?.dimensions,
					aspectRatio: undefined, // Reset aspect ratio when minHeight is set.
				},
			} ),
		} );
	};

	return (
		<>
			{ ! isContentOnlyMode && (
				<BlockControls group="block">
					<BlockAlignmentMatrixControl
						label={ __( 'Change content position' ) }
						value={ contentPosition }
						onChange={ ( nextPosition ) =>
							setAttributes( {
								contentPosition: nextPosition,
							} )
						}
						isDisabled={ ! hasInnerBlocks }
					/>
					<FullHeightAlignmentControl
						isActive={ isMinFullHeight }
						onToggle={ toggleMinFullHeight }
						isDisabled={ ! hasInnerBlocks }
					/>
				</BlockControls>
			) }
			<BlockControls group="other">
				<MediaReplaceFlow
					mediaId={ id }
					mediaURL={ url }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					accept="image/*,video/*"
					onSelect={ onSelectMedia }
					onToggleFeaturedImage={ toggleUseFeaturedImage }
					useFeaturedImage={ useFeaturedImage }
					name={ ! url ? __( 'Add media' ) : __( 'Replace' ) }
					onReset={ onClearMedia }
				>
					{ ( { onClose } ) => (
						<MenuItem
							icon={ link }
							onClick={ () => {
								setIsEmbedUrlInputOpen( true );
								onClose();
							} }
						>
							{ __( 'Embed video from URL' ) }
						</MenuItem>
					) }
				</MediaReplaceFlow>
			</BlockControls>
			{ isEmbedUrlInputOpen && (
				<EmbedVideoUrlInput
					onSubmit={ ( embedUrl ) => {
						onSelectEmbedUrl( embedUrl );
					} }
					onClose={ () => setIsEmbedUrlInputOpen( false ) }
				/>
			) }
		</>
	);
}
