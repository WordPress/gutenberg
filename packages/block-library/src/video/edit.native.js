/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import {
	mediaUploadSync,
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
} from '@wordpress/react-native-bridge';
import {
	Icon,
	ToolbarButton,
	ToolbarGroup,
	PanelBody,
} from '@wordpress/components';
import { withPreferredColorScheme, compose } from '@wordpress/compose';
import {
	BlockCaption,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadProgress,
	MEDIA_TYPE_VIDEO,
	BlockControls,
	VIDEO_ASPECT_RATIO,
	VideoPlayer,
	InspectorControls,
	RichText,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { isURL, getProtocol } from '@wordpress/url';
import { doAction, hasAction } from '@wordpress/hooks';
import { video as SvgIcon, replace } from '@wordpress/icons';
import { withDispatch, withSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { createUpgradedEmbedBlock } from '../embed/util';
import style from './style.scss';
import SvgIconRetry from './icon-retry';
import VideoCommonSettings from './edit-common-settings';

const ICON_TYPE = {
	PLACEHOLDER: 'placeholder',
	RETRY: 'retry',
	UPLOAD: 'upload',
};

class VideoEdit extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			isCaptionSelected: false,
			videoContainerHeight: 0,
		};

		this.mediaUploadStateReset = this.mediaUploadStateReset.bind( this );
		this.onSelectMediaUploadOption =
			this.onSelectMediaUploadOption.bind( this );
		this.onSelectURL = this.onSelectURL.bind( this );
		this.finishMediaUploadWithSuccess =
			this.finishMediaUploadWithSuccess.bind( this );
		this.finishMediaUploadWithFailure =
			this.finishMediaUploadWithFailure.bind( this );
		this.updateMediaProgress = this.updateMediaProgress.bind( this );
		this.onVideoPressed = this.onVideoPressed.bind( this );
		this.onVideoContanerLayout = this.onVideoContanerLayout.bind( this );
		this.onFocusCaption = this.onFocusCaption.bind( this );
	}

	componentDidMount() {
		const { attributes } = this.props;
		if ( attributes.id && getProtocol( attributes.src ) === 'file:' ) {
			mediaUploadSync();
		}
	}

	componentWillUnmount() {
		// This action will only exist if the user pressed the trash button on the block holder.
		if (
			hasAction( 'blocks.onRemoveBlockCheckUpload' ) &&
			this.state.isUploadInProgress
		) {
			doAction(
				'blocks.onRemoveBlockCheckUpload',
				this.props.attributes.id
			);
		}
	}

	static getDerivedStateFromProps( props, state ) {
		// Avoid a UI flicker in the toolbar by insuring that isCaptionSelected
		// is updated immediately any time the isSelected prop becomes false.
		return {
			isCaptionSelected: props.isSelected && state.isCaptionSelected,
		};
	}

	onVideoPressed() {
		const { attributes } = this.props;

		if ( this.state.isUploadInProgress ) {
			requestImageUploadCancelDialog( attributes.id );
		} else if (
			attributes.id &&
			getProtocol( attributes.src ) === 'file:'
		) {
			requestImageFailedRetryDialog( attributes.id );
		}

		this.setState( {
			isCaptionSelected: false,
		} );
	}

	onFocusCaption() {
		if ( ! this.state.isCaptionSelected ) {
			this.setState( { isCaptionSelected: true } );
		}
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
		setAttributes( { src: payload.mediaUrl, id: payload.mediaServerId } );
		this.setState( { isUploadInProgress: false } );
	}

	finishMediaUploadWithFailure( payload ) {
		const { setAttributes } = this.props;
		setAttributes( { id: payload.mediaId } );
		this.setState( { isUploadInProgress: false } );
	}

	mediaUploadStateReset() {
		const { setAttributes } = this.props;
		setAttributes( { id: null, src: null } );
		this.setState( { isUploadInProgress: false } );
	}

	onSelectMediaUploadOption( { id, url } ) {
		const { setAttributes } = this.props;
		setAttributes( { id, src: url } );
	}

	onSelectURL( url ) {
		const { createErrorNotice, onReplace, setAttributes } = this.props;

		if ( isURL( url ) && /^https?:/.test( getProtocol( url ) ) ) {
			// Check if there's an embed block that handles this URL.
			const embedBlock = createUpgradedEmbedBlock( {
				attributes: { url },
			} );
			if ( undefined !== embedBlock ) {
				onReplace( embedBlock );
				return;
			}

			setAttributes( { src: url, id: undefined, poster: undefined } );
		} else {
			createErrorNotice( __( 'Invalid URL.' ) );
		}
	}

	onVideoContanerLayout( event ) {
		const { width } = event.nativeEvent.layout;
		const height = width / VIDEO_ASPECT_RATIO;
		if ( height !== this.state.videoContainerHeight ) {
			this.setState( { videoContainerHeight: height } );
		}
	}

	getIcon( iconType ) {
		let iconStyle;
		switch ( iconType ) {
			case ICON_TYPE.RETRY:
				return <Icon icon={ SvgIconRetry } { ...style.icon } />;
			case ICON_TYPE.PLACEHOLDER:
				iconStyle = this.props.getStylesFromColorScheme(
					style.icon,
					style.iconDark
				);
				break;
			case ICON_TYPE.UPLOAD:
				iconStyle = this.props.getStylesFromColorScheme(
					style.iconUploading,
					style.iconUploadingDark
				);
				break;
		}

		return <Icon icon={ SvgIcon } { ...iconStyle } />;
	}

	render() {
		const { setAttributes, attributes, isSelected, wasBlockJustInserted } =
			this.props;
		const { id, src } = attributes;
		const { videoContainerHeight } = this.state;

		const toolbarEditButton = (
			<MediaUpload
				allowedTypes={ [ MEDIA_TYPE_VIDEO ] }
				isReplacingMedia
				onSelect={ this.onSelectMediaUploadOption }
				onSelectURL={ this.onSelectURL }
				render={ ( { open, getMediaOptions } ) => {
					return (
						<ToolbarGroup>
							{ getMediaOptions() }
							<ToolbarButton
								label={ __( 'Edit video' ) }
								icon={ replace }
								onClick={ open }
							/>
						</ToolbarGroup>
					);
				} }
			></MediaUpload>
		);

		if ( ! src ) {
			return (
				<View style={ { flex: 1 } }>
					<MediaPlaceholder
						allowedTypes={ [ MEDIA_TYPE_VIDEO ] }
						onSelect={ this.onSelectMediaUploadOption }
						onSelectURL={ this.onSelectURL }
						icon={ this.getIcon( ICON_TYPE.PLACEHOLDER ) }
						onFocus={ this.props.onFocus }
						autoOpenMediaUpload={
							isSelected && wasBlockJustInserted
						}
					/>
				</View>
			);
		}

		return (
			<TouchableWithoutFeedback
				accessible={ ! isSelected }
				onPress={ this.onVideoPressed }
				disabled={ ! isSelected }
			>
				<View style={ { flex: 1 } }>
					{ ! this.state.isCaptionSelected && (
						<BlockControls>{ toolbarEditButton }</BlockControls>
					) }
					{ isSelected && (
						<InspectorControls>
							<PanelBody title={ __( 'Settings' ) }>
								<VideoCommonSettings
									setAttributes={ setAttributes }
									attributes={ attributes }
								/>
							</PanelBody>
						</InspectorControls>
					) }
					<MediaUploadProgress
						mediaId={ id }
						onFinishMediaUploadWithSuccess={
							this.finishMediaUploadWithSuccess
						}
						onFinishMediaUploadWithFailure={
							this.finishMediaUploadWithFailure
						}
						onUpdateMediaProgress={ this.updateMediaProgress }
						onMediaUploadStateReset={ this.mediaUploadStateReset }
						renderContent={ ( {
							isUploadInProgress,
							isUploadFailed,
							retryMessage,
						} ) => {
							const showVideo =
								isURL( src ) &&
								getProtocol( attributes.src ) !== 'file:' &&
								! isUploadInProgress &&
								! isUploadFailed;

							const icon = this.getIcon(
								isUploadFailed
									? ICON_TYPE.RETRY
									: ICON_TYPE.UPLOAD
							);
							const styleIconContainer = isUploadFailed
								? style.modalIconRetry
								: style.modalIcon;

							const iconContainer = (
								<View style={ styleIconContainer }>
									{ icon }
								</View>
							);

							const videoStyle = {
								height: videoContainerHeight,
								...style.video,
							};

							const containerStyle =
								showVideo && isSelected
									? style.containerFocused
									: style.container;

							return (
								<View
									onLayout={ this.onVideoContanerLayout }
									style={ containerStyle }
								>
									{ showVideo && (
										<View style={ style.videoContainer }>
											<VideoPlayer
												isSelected={
													isSelected &&
													! this.state
														.isCaptionSelected
												}
												style={ videoStyle }
												source={ { uri: src } }
												paused
											/>
										</View>
									) }
									{ ! showVideo && (
										<View
											style={ {
												height: videoContainerHeight,
												width: '100%',
												...this.props.getStylesFromColorScheme(
													style.placeholderContainer,
													style.placeholderContainerDark
												),
											} }
										>
											{ videoContainerHeight > 0 &&
												iconContainer }
											{ isUploadFailed && (
												<Text
													style={
														style.uploadFailedText
													}
												>
													{ retryMessage }
												</Text>
											) }
										</View>
									) }
								</View>
							);
						} }
					/>
					<BlockCaption
						accessible
						accessibilityLabelCreator={ ( caption ) =>
							RichText.isEmpty( caption )
								? /* translators: accessibility text. Empty video caption. */
								  __( 'Video caption. Empty' )
								: sprintf(
										/* translators: accessibility text. %s: video caption. */
										__( 'Video caption. %s' ),
										caption
								  )
						}
						clientId={ this.props.clientId }
						isSelected={ this.state.isCaptionSelected }
						onFocus={ this.onFocusCaption }
						onBlur={ this.props.onBlur } // Always assign onBlur as props.
						insertBlocksAfter={ this.props.insertBlocksAfter }
					/>
				</View>
			</TouchableWithoutFeedback>
		);
	}
}

export default compose( [
	withSelect( ( select, { clientId } ) => ( {
		wasBlockJustInserted: select( blockEditorStore ).wasBlockJustInserted(
			clientId,
			'inserter_menu'
		),
	} ) ),
	withDispatch( ( dispatch ) => {
		const { createErrorNotice } = dispatch( noticesStore );

		return { createErrorNotice };
	} ),
	withPreferredColorScheme,
] )( VideoEdit );
