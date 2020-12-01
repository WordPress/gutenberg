/**
 * External dependencies
 */
import { Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { View } from '@wordpress/primitives';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	withNotices,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadProgress,
	RichText,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { audio as icon, replace } from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];

function AudioEdit( {
	attributes,
	noticeOperations,
	setAttributes,
	isSelected,
	noticeUI,
	insertBlocksAfter,
	onFocus,
} ) {
	const { id, autoplay, caption, loop, preload, src } = attributes;

	const onFileChange = ( { mediaId, mediaUrl } ) => {
		setAttributes( { id: mediaId, src: mediaUrl } );
	};

	const onError = () => {
		// TODO: Set up error state
		onUploadError( __( 'Error' ) );
	};

	function toggleAttribute( attribute ) {
		return ( newValue ) => {
			setAttributes( { [ attribute ]: newValue } );
		};
	}

	function onSelectURL() {
		// TODO: Set up add audio from URL flow
	}

	function onUploadError( message ) {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	}

	function getAutoplayHelp( checked ) {
		return checked
			? __(
					'Note: Autoplaying audio may cause usability issues for some visitors.'
			  )
			: null;
	}

	// const { setAttributes, isSelected, noticeUI } = this.props;
	function onSelectAudio( media ) {
		if ( ! media || ! media.url ) {
			// in this case there was an error and we should continue in the editing state
			// previous attributes should be removed because they may be temporary blob urls
			setAttributes( { src: undefined, id: undefined } );
			return;
		}
		// sets the block's attribute and updates the edit component from the
		// selected media, then switches off the editing UI
		setAttributes( { src: media.url, id: media.id } );
	}

	if ( ! src ) {
		return (
			<View>
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					onSelect={ onSelectAudio }
					onSelectURL={ onSelectURL }
					accept="audio/*"
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					value={ attributes }
					notices={ noticeUI }
					onError={ onUploadError }
					onFocus={ onFocus }
				/>
			</View>
		);
	}

	function getBlockControls( open ) {
		return (
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						title={ __( 'Edit audio' ) }
						icon={ replace }
						onClick={ open }
					/>
				</ToolbarGroup>
			</BlockControls>
		);
	}

	function getBlockUI( open, getMediaOptions ) {
		return (
			<MediaUploadProgress
				mediaId={ id }
				onUpdateMediaProgress={ this.updateMediaProgress }
				onFinishMediaUploadWithSuccess={ onFileChange }
				onFinishMediaUploadWithFailure={ onError }
				onMediaUploadStateReset={ onFileChange }
				renderContent={ ( { isUploadInProgress, isUploadFailed } ) => {
					return (
						<View>
							{ getBlockControls( open ) }
							{ getMediaOptions() }
							<Text>
								⏯ Audio Player goes here.{ ' ' }
								{ isUploadInProgress && 'Uploading...' }
								{ isUploadFailed && 'ERROR' }
							</Text>
							{ ( ! RichText.isEmpty( caption ) ||
								isSelected ) && (
								<RichText
									tagName="figcaption"
									placeholder={ __( 'Write caption…' ) }
									value={ caption }
									onChange={ ( value ) =>
										setAttributes( { caption: value } )
									}
									inlineToolbar
									__unstableOnSplitAtEnd={ () =>
										insertBlocksAfter(
											createBlock( 'core/paragraph' )
										)
									}
								/>
							) }
						</View>
					);
				} }
			/>
		);
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Audio settings' ) }>
					<ToggleControl
						label={ __( 'Autoplay' ) }
						onChange={ toggleAttribute( 'autoplay' ) }
						checked={ autoplay }
						help={ getAutoplayHelp }
					/>
					<ToggleControl
						label={ __( 'Loop' ) }
						onChange={ toggleAttribute( 'loop' ) }
						checked={ loop }
					/>
					<SelectControl
						label={ __( 'Preload' ) }
						value={ preload || '' }
						// `undefined` is required for the preload attribute to be unset.
						onChange={ ( value ) =>
							setAttributes( {
								preload: value || undefined,
							} )
						}
						options={ [
							{ value: '', label: __( 'Browser default' ) },
							{ value: 'auto', label: __( 'Auto' ) },
							{ value: 'metadata', label: __( 'Metadata' ) },
							{ value: 'none', label: __( 'None' ) },
						] }
					/>
				</PanelBody>
			</InspectorControls>
			<MediaUpload
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				isReplacingMedia={ true }
				onSelect={ onSelectAudio }
				render={ ( { open, getMediaOptions } ) => {
					return getBlockUI( open, getMediaOptions );
				} }
			/>
		</>
	);
}
export default withNotices( AudioEdit );
