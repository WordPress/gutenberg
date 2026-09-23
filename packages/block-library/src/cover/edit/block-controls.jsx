import { useState } from '@wordpress/element';
import {
	BlockControls,
	MediaReplaceFlow,
	useSettings,
	__experimentalBlockAlignmentMatrixControl as BlockAlignmentMatrixControl,
	__experimentalBlockFullHeightAligmentControl as FullHeightAlignmentControl,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { MenuItem, ToolbarButton } from '@wordpress/components';
import { crop, link } from '@wordpress/icons';
import { ALLOWED_MEDIA_TYPES, EMBED_VIDEO_BACKGROUND_TYPE } from '../shared';
import { unlock } from '../../lock-unlock';
import EmbedVideoUrlInput from './embed-video-url-input';
import { getAllowedVideoProviders } from '../embed-video-utils';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

const FULL_HEIGHT = '100vh';

export default function CoverBlockControls( {
	attributes,
	setAttributes,
	onSelectMedia,
	currentSettings,
	toggleUseFeaturedImage,
	onClearMedia,
	onSelectEmbedUrl,
	onEditMedia,
	editMediaButtonRef,
	showEditMediaButton,
	isEditMediaDisabled,
	blockEditingMode,
} ) {
	const {
		contentPosition,
		id,
		useFeaturedImage,
		style,
		backgroundType,
		allowedVideoProviders,
	} = attributes;
	const { hasInnerBlocks, url } = currentSettings;

	const filteredVideoProviders = getAllowedVideoProviders(
		allowedVideoProviders
	);
	const hasAllowedVideoProviders = filteredVideoProviders.length > 0;

	const [ isMinHeightEnabled ] = useSettings( 'dimensions.minHeight' );
	const minHeight = style?.dimensions?.minHeight;
	const [ prevMinHeight, setPrevMinHeight ] = useState( minHeight );
	const [ isEmbedUrlInputOpen, setIsEmbedUrlInputOpen ] = useState( false );
	const isMinFullHeight =
		minHeight === FULL_HEIGHT && ! style?.dimensions?.aspectRatio;
	const isContentOnlyMode = blockEditingMode === 'contentOnly';

	const setMinHeight = ( nextMinHeight ) =>
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				dimensions: {
					...style?.dimensions,
					minHeight: nextMinHeight,
					aspectRatio: undefined, // Reset aspect ratio when minHeight is set.
				},
			} ),
		} );

	const toggleMinFullHeight = () => {
		if ( isMinFullHeight ) {
			return setMinHeight(
				prevMinHeight === FULL_HEIGHT ? undefined : prevMinHeight
			);
		}
		setPrevMinHeight( minHeight );
		return setMinHeight( FULL_HEIGHT );
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
					{ isMinHeightEnabled && (
						<FullHeightAlignmentControl
							isActive={ isMinFullHeight }
							onToggle={ toggleMinFullHeight }
							isDisabled={ ! hasInnerBlocks }
						/>
					) }
					{ showEditMediaButton && (
						<ToolbarButton
							ref={ editMediaButtonRef }
							icon={ crop }
							label={ __( 'Edit image' ) }
							onClick={ onEditMedia }
							aria-haspopup="dialog"
							// Disable rather than hide while the edited image
							// loads, so the button keeps focus when the modal
							// closes instead of dropping it to the canvas.
							disabled={ isEditMediaDisabled }
						/>
					) }
				</BlockControls>
			) }
			<BlockControls group="other">
				<MediaReplaceFlow
					mediaId={ id }
					mediaURL={ url }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					onSelect={ onSelectMedia }
					onToggleFeaturedImage={ toggleUseFeaturedImage }
					useFeaturedImage={ useFeaturedImage }
					name={ ! url ? __( 'Add media' ) : __( 'Replace' ) }
					onReset={ onClearMedia }
					variant="toolbar"
				>
					{ ( { onClose } ) =>
						hasAllowedVideoProviders ? (
							<MenuItem
								icon={ link }
								onClick={ () => {
									setIsEmbedUrlInputOpen( true );
									onClose();
								} }
							>
								{ __( 'Embed video from URL' ) }
							</MenuItem>
						) : null
					}
				</MediaReplaceFlow>
			</BlockControls>
			{ isEmbedUrlInputOpen && (
				<EmbedVideoUrlInput
					onSubmit={ ( embedUrl ) => {
						onSelectEmbedUrl( embedUrl );
					} }
					onClose={ () => setIsEmbedUrlInputOpen( false ) }
					initialUrl={
						backgroundType === EMBED_VIDEO_BACKGROUND_TYPE
							? url
							: ''
					}
					allowedVideoProviders={ filteredVideoProviders }
				/>
			) }
		</>
	);
}
