/**
 * External dependencies
 */
import React from 'react';
import { View, ImageBackground, Text, TouchableWithoutFeedback, Dimensions } from 'react-native';
import {
	requestMediaImport,
	mediaUploadSync,
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
} from 'react-native-gutenberg-bridge';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	BottomSheet,
	Icon,
	Toolbar,
	ToolbarButton,
} from '@wordpress/components';
import {
	Caption,
	MediaPlaceholder,
	MediaUpload,
	MEDIA_TYPE_IMAGE,
	BlockControls,
	InspectorControls,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';
import { doAction, hasAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import MediaUploadProgress from './media-upload-progress';
import SvgIcon from './icon';
import SvgIconRetry from './icon-retry';

const LINK_DESTINATION_CUSTOM = 'custom';
const LINK_DESTINATION_NONE = 'none';

// Default Image ratio 4:3
const IMAGE_ASPECT_RATIO = 4 / 3;

class ImageEdit extends React.Component {
	constructor( props ) {
		super( props );

		this.state = {
			showSettings: false,
			isCaptionSelected: false,
		};

		this.finishMediaUploadWithSuccess = this.finishMediaUploadWithSuccess.bind( this );
		this.finishMediaUploadWithFailure = this.finishMediaUploadWithFailure.bind( this );
		this.mediaUploadStateReset = this.mediaUploadStateReset.bind( this );
		this.onSelectMediaUploadOption = this.onSelectMediaUploadOption.bind( this );
		this.updateMediaProgress = this.updateMediaProgress.bind( this );
		this.updateAlt = this.updateAlt.bind( this );
		this.updateImageURL = this.updateImageURL.bind( this );
		this.onSetLinkDestination = this.onSetLinkDestination.bind( this );
		this.onImagePressed = this.onImagePressed.bind( this );
		this.onClearSettings = this.onClearSettings.bind( this );
		this.onFocusCaption = this.onFocusCaption.bind( this );
	}

	componentDidMount() {
		const { attributes, setAttributes } = this.props;

		// This will warn when we have `id` defined, while `url` is undefined.
		// This may help track this issue: https://github.com/wordpress-mobile/WordPress-Android/issues/9768
		// where a cancelled image upload was resulting in a subsequent crash.
		if ( attributes.id && ! attributes.url ) {
			// eslint-disable-next-line no-console
			console.warn( 'Attributes has id with no url.' );
		}

		if ( attributes.id && attributes.url && ! isURL( attributes.url ) ) {
			if ( attributes.url.indexOf( 'file:' ) === 0 ) {
				requestMediaImport( attributes.url, ( mediaId, mediaUri ) => {
					if ( mediaUri ) {
						setAttributes( { url: mediaUri, id: mediaId } );
					}
				} );
			}
			mediaUploadSync();
		}
	}

	componentWillUnmount() {
		// this action will only exist if the user pressed the trash button on the block holder
		if ( hasAction( 'blocks.onRemoveBlockCheckUpload' ) && this.state.isUploadInProgress ) {
			doAction( 'blocks.onRemoveBlockCheckUpload', this.props.attributes.id );
		}
	}

	static getDerivedStateFromProps( props, state ) {
		// Avoid a UI flicker in the toolbar by insuring that isCaptionSelected
		// is updated immediately any time the isSelected prop becomes false
		return {
			isCaptionSelected: props.isSelected && state.isCaptionSelected,
		};
	}

	onImagePressed() {
		const { attributes } = this.props;

		if ( this.state.isUploadInProgress ) {
			requestImageUploadCancelDialog( attributes.id );
		} else if ( attributes.id && ! isURL( attributes.url ) ) {
			requestImageFailedRetryDialog( attributes.id );
		}

		this.setState( {
			isCaptionSelected: false,
		} );
	}

	updateMediaProgress( payload ) {
		const { setAttributes } = this.props;
		if ( payload.mediaUrl ) {
			setAttributes( { url: payload.mediaUrl } );
		}

		if ( ! this.state.isUploadInProgress ) {
			this.setState( { isUploadInProgress: true } );
		}
	}

	finishMediaUploadWithSuccess( payload ) {
		const { setAttributes } = this.props;

		setAttributes( { url: payload.mediaUrl, id: payload.mediaServerId } );
		this.setState( { isUploadInProgress: false } );
	}

	finishMediaUploadWithFailure( payload ) {
		const { setAttributes } = this.props;

		setAttributes( { id: payload.mediaId } );
		this.setState( { isUploadInProgress: false } );
	}

	mediaUploadStateReset() {
		const { setAttributes } = this.props;

		setAttributes( { id: null, url: null } );
		this.setState( { isUploadInProgress: false } );
	}

	updateAlt( newAlt ) {
		this.props.setAttributes( { alt: newAlt } );
	}

	updateImageURL( url ) {
		this.props.setAttributes( { url, width: undefined, height: undefined } );
	}

	onSetLinkDestination( href ) {
		this.props.setAttributes( {
			linkDestination: LINK_DESTINATION_CUSTOM,
			href,
		} );
	}

	onClearSettings() {
		this.props.setAttributes( {
			alt: '',
			linkDestination: LINK_DESTINATION_NONE,
			href: undefined,
		} );
	}

	onSelectMediaUploadOption( mediaId, mediaUrl ) {
		const { setAttributes } = this.props;
		setAttributes( { url: mediaUrl, id: mediaId } );
	}

	onFocusCaption() {
		if ( this.props.onFocus ) {
			this.props.onFocus();
		}
		if ( ! this.state.isCaptionSelected ) {
			this.setState( {
				isCaptionSelected: true,
			} );
		}
	}

	getIcon( isRetryIcon ) {
		if ( isRetryIcon ) {
			return <Icon icon={ SvgIconRetry } { ...styles.iconRetry } />;
		}

		return <Icon icon={ SvgIcon } { ...styles.icon } />;
	}

	render() {
		const { attributes, isSelected, setAttributes } = this.props;
		const { url, caption, height, width, alt, href, id } = attributes;

		const onImageSettingsButtonPressed = () => {
			this.setState( { showSettings: true } );
		};

		const onImageSettingsClose = () => {
			this.setState( { showSettings: false } );
		};

		const getToolbarEditButton = ( open ) => (
			<BlockControls>
				<Toolbar>
					<ToolbarButton
						title={ __( 'Edit image' ) }
						icon="edit"
						onClick={ open }
					/>
				</Toolbar>
			</BlockControls>
		);

		const getInspectorControls = () => (
			<BottomSheet
				isVisible={ this.state.showSettings }
				onClose={ onImageSettingsClose }
				hideHeader
			>
				<BottomSheet.Cell
					icon={ 'admin-links' }
					label={ __( 'Link To' ) }
					value={ href || '' }
					valuePlaceholder={ __( 'Add URL' ) }
					onChangeValue={ this.onSetLinkDestination }
					autoCapitalize="none"
					autoCorrect={ false }
					keyboardType="url"
				/>
				<BottomSheet.Cell
					icon={ 'editor-textcolor' }
					label={ __( 'Alt Text' ) }
					value={ alt || '' }
					valuePlaceholder={ __( 'None' ) }
					separatorType={ 'fullWidth' }
					onChangeValue={ this.updateAlt }
				/>
				<BottomSheet.Cell
					label={ __( 'Clear All Settings' ) }
					labelStyle={ styles.clearSettingsButton }
					separatorType={ 'none' }
					onPress={ this.onClearSettings }
				/>
			</BottomSheet>
		);

		if ( ! url ) {
			return (
				<View style={ { flex: 1 } } >
					<MediaPlaceholder
						mediaType={ MEDIA_TYPE_IMAGE }
						onSelectURL={ this.onSelectMediaUploadOption }
						icon={ this.getIcon( false ) }
						onFocus={ this.props.onFocus }
					/>
				</View>
			);
		}

		const imageContainerHeight = Dimensions.get( 'window' ).width / IMAGE_ASPECT_RATIO;
		const getImageComponent = ( openMediaOptions, getMediaOptions ) => (
			<TouchableWithoutFeedback
				accessible={ ! isSelected }
				onPress={ this.onImagePressed }
				onLongPress={ openMediaOptions }
				disabled={ ! isSelected }
			>
				<View style={ { flex: 1 } }>
					{ getInspectorControls() }
					{ getMediaOptions() }
					{ ( ! this.state.isCaptionSelected ) &&
						getToolbarEditButton( openMediaOptions )
					}
					<InspectorControls>
						<ToolbarButton
							title={ __( 'Image Settings' ) }
							icon="admin-generic"
							onClick={ onImageSettingsButtonPressed }
						/>
					</InspectorControls>
					<MediaUploadProgress
						height={ height }
						width={ width }
						coverUrl={ url }
						mediaId={ id }
						onUpdateMediaProgress={ this.updateMediaProgress }
						onFinishMediaUploadWithSuccess={ this.finishMediaUploadWithSuccess }
						onFinishMediaUploadWithFailure={ this.finishMediaUploadWithFailure }
						onMediaUploadStateReset={ this.mediaUploadStateReset }
						renderContent={ ( { isUploadInProgress, isUploadFailed, finalWidth, finalHeight, imageWidthWithinContainer, retryMessage } ) => {
							const opacity = isUploadInProgress ? 0.3 : 1;
							const icon = this.getIcon( isUploadFailed );

							const iconContainer = (
								<View style={ styles.modalIcon }>
									{ icon }
								</View>
							);

							return (
								<View style={ { flex: 1 } } >
									{ ! imageWidthWithinContainer &&
										<View style={ [ styles.imageContainer, { height: imageContainerHeight } ] } >
											{ this.getIcon( false ) }
										</View> }
									<ImageBackground
										accessible={ true }
										disabled={ ! isSelected }
										accessibilityLabel={ alt }
										accessibilityHint={ __( 'Double tap and hold to edit' ) }
										accessibilityRole={ 'imagebutton' }
										style={ { width: finalWidth, height: finalHeight, opacity } }
										resizeMethod="scale"
										source={ { uri: url } }
										key={ url }
									>
										{ isUploadFailed &&
											<View style={ [ styles.imageContainer, { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' } ] } >
												{ iconContainer }
												<Text style={ styles.uploadFailedText }>{ retryMessage }</Text>
											</View>
										}
									</ImageBackground>
								</View>
							);
						} }
					/>
					<Caption
						text={ caption }
						isParentSelected={ isSelected }
						isSelected={ this.state.isCaptionSelected }
						accessible={ true }
						accessibilityLabel={
							isEmpty( caption ) ?
							/* translators: accessibility text. Empty image caption. */
								( 'Image caption. Empty' ) :
								sprintf(
								/* translators: accessibility text. %s: image caption. */
									__( 'Image caption. %s' ),
									caption )
						}
						onChange={ ( newCaption ) => setAttributes( { caption: newCaption } ) }
						onFocus={ this.onFocusCaption }
					/>
				</View>
			</TouchableWithoutFeedback>
		);

		return (
			<MediaUpload mediaType={ MEDIA_TYPE_IMAGE }
				onSelectURL={ this.onSelectMediaUploadOption }
				render={ ( { open, getMediaOptions } ) => {
					return getImageComponent( open, getMediaOptions );
				} }
			/>
		);
	}
}

export default ImageEdit;
