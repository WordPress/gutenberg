/**
 * External dependencies
 */
import { TouchableWithoutFeedback } from 'react-native';
import { isEmpty } from 'lodash';

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
	AudioPlayer,
} from '@wordpress/components';
import {
	BlockCaption,
	BlockControls,
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadProgress,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { audio as icon, replace } from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];

function AudioEdit( {
	attributes,
	noticeOperations,
	setAttributes,
	isSelected,
	noticeUI,
	insertBlocksAfter,
	onFocus,
	onBlur,
	clientId,
} ) {
	const { id, autoplay, loop, preload, src } = attributes;

	const [ isCaptionSelected, setIsCaptionSelected ] = useState( false );

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

	function onAudioPress() {
		setIsCaptionSelected( false );
	}

	function onFocusCaption() {
		if ( ! isCaptionSelected ) {
			setIsCaptionSelected( true );
		}
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
						title={ __( 'Replace audio' ) }
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
				containerStyle={ styles.progressContainer }
				progressBarStyle={ styles.progressBar }
				spinnerStyle={ styles.spinner }
				renderContent={ ( {
					isUploadInProgress,
					isUploadFailed,
					retryMessage,
				} ) => {
					return (
						<>
							{ ! isCaptionSelected && getBlockControls( open ) }
							{ getMediaOptions() }
							<AudioPlayer
								isUploadInProgress={ isUploadInProgress }
								isUploadFailed={ isUploadFailed }
								retryMessage={ retryMessage }
								attributes={ attributes }
								isSelected={ isSelected }
							/>
						</>
					);
				} }
			/>
		);
	}

	return (
		<TouchableWithoutFeedback
			accessible={ ! isSelected }
			onPress={ onAudioPress }
			disabled={ ! isSelected }
		>
			<View>
				<InspectorControls>
					<PanelBody title={ __( 'Audio settings' ) }>
						<ToggleControl
							label={ __( 'Autoplay' ) }
							onChange={ toggleAttribute( 'autoplay' ) }
							checked={ autoplay }
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
				<BlockCaption
					accessible={ true }
					accessibilityLabelCreator={ ( caption ) =>
						isEmpty( caption )
							? /* translators: accessibility text. Empty Audio caption. */
							  __( 'Audio caption. Empty' )
							: sprintf(
									/* translators: accessibility text. %s: Audio caption. */
									__( 'Audio caption. %s' ),
									caption
							  )
					}
					clientId={ clientId }
					isSelected={ isCaptionSelected }
					onFocus={ onFocusCaption }
					onBlur={ onBlur }
					insertBlocksAfter={ insertBlocksAfter }
				/>
			</View>
		</TouchableWithoutFeedback>
	);
}
export default withNotices( AudioEdit );
