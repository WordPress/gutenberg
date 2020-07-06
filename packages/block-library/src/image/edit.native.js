/**
 * External dependencies
 */
import React from 'react';
import {
	View,
	ImageBackground,
	Text,
	TouchableWithoutFeedback,
	Dimensions,
} from 'react-native';
/**
 * WordPress dependencies
 */
import {
	requestMediaImport,
	mediaUploadSync,
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
	requestImageFullscreenPreview,
} from '@wordpress/react-native-bridge';
import { isEmpty, get, find, map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	CycleSelectControl,
	Icon,
	PanelBody,
	TextControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import {
	BlockCaption,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadProgress,
	MEDIA_TYPE_IMAGE,
	BlockControls,
	InspectorControls,
	BlockAlignmentToolbar,
	MediaEdit,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { getProtocol } from '@wordpress/url';
import { doAction, hasAction } from '@wordpress/hooks';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import {
	external,
	link,
	image as icon,
	textColor,
	replace,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import SvgIconRetry from './icon-retry';
import SvgIconCustomize from './icon-customize';
import { getUpdatedLinkTargetSettings } from './utils';

import { LINK_DESTINATION_CUSTOM, DEFAULT_SIZE_SLUG } from './constants';

const ICON_TYPE = {
	PLACEHOLDER: 'placeholder',
	RETRY: 'retry',
	UPLOAD: 'upload',
};

// Default Image ratio 4:3
const IMAGE_ASPECT_RATIO = 4 / 3;

const getUrlForSlug = ( image, { sizeSlug } ) => {
	return get( image, [ 'media_details', 'sizes', sizeSlug, 'source_url' ] );
};

export class ImageEdit extends React.Component {
	constructor( props ) {
		super( props );

		this.state = {
			isCaptionSelected: false,
		};

		this.finishMediaUploadWithSuccess = this.finishMediaUploadWithSuccess.bind(
			this
		);
		this.finishMediaUploadWithFailure = this.finishMediaUploadWithFailure.bind(
			this
		);
		this.mediaUploadStateReset = this.mediaUploadStateReset.bind( this );
		this.onSelectMediaUploadOption = this.onSelectMediaUploadOption.bind(
			this
		);
		this.updateMediaProgress = this.updateMediaProgress.bind( this );
		this.updateAlt = this.updateAlt.bind( this );
		this.updateImageURL = this.updateImageURL.bind( this );
		this.onSetLinkDestination = this.onSetLinkDestination.bind( this );
		this.onSetNewTab = this.onSetNewTab.bind( this );
		this.onSetSizeSlug = this.onSetSizeSlug.bind( this );
		this.onImagePressed = this.onImagePressed.bind( this );
		this.onFocusCaption = this.onFocusCaption.bind( this );
		this.updateAlignment = this.updateAlignment.bind( this );
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

		// Detect any pasted image and start an upload
		if (
			! attributes.id &&
			attributes.url &&
			getProtocol( attributes.url ) === 'file:'
		) {
			requestMediaImport( attributes.url, ( id, url ) => {
				if ( url ) {
					setAttributes( { id, url } );
				}
			} );
		}

		// Make sure we mark any temporary images as failed if they failed while
		// the editor wasn't open
		if (
			attributes.id &&
			attributes.url &&
			getProtocol( attributes.url ) === 'file:'
		) {
			mediaUploadSync();
		}
	}

	componentWillUnmount() {
		// this action will only exist if the user pressed the trash button on the block holder
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

	componentDidUpdate( previousProps ) {
		if ( ! previousProps.image && this.props.image ) {
			const { image, attributes } = this.props;
			const url = getUrlForSlug( image, attributes ) || image.source_url;
			this.props.setAttributes( { url } );
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
		const { attributes, image } = this.props;

		if ( this.state.isUploadInProgress ) {
			requestImageUploadCancelDialog( attributes.id );
		} else if (
			attributes.id &&
			getProtocol( attributes.url ) === 'file:'
		) {
			requestImageFailedRetryDialog( attributes.id );
		} else if ( ! this.state.isCaptionSelected ) {
			requestImageFullscreenPreview(
				attributes.url,
				image && image.source_url
			);
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
		this.props.setAttributes( {
			url,
			width: undefined,
			height: undefined,
		} );
	}

	updateAlignment( nextAlign ) {
		this.props.setAttributes( { align: nextAlign } );
	}

	onSetLinkDestination( href ) {
		this.props.setAttributes( {
			linkDestination: LINK_DESTINATION_CUSTOM,
			href,
		} );
	}

	onSetNewTab( value ) {
		const updatedLinkTarget = getUpdatedLinkTargetSettings(
			value,
			this.props.attributes
		);
		this.props.setAttributes( updatedLinkTarget );
	}

	onSetSizeSlug( sizeSlug ) {
		const { image } = this.props;

		const url = getUrlForSlug( image, { sizeSlug } );
		if ( ! url ) {
			return null;
		}

		this.props.setAttributes( {
			url,
			width: undefined,
			height: undefined,
			sizeSlug,
		} );
	}

	onSelectMediaUploadOption( media ) {
		const { id, url } = this.props.attributes;

		const mediaAttributes = {
			id: media.id,
			url: media.url,
			caption: media.caption,
		};

		let additionalAttributes;
		// Reset the dimension attributes if changing to a different image.
		if ( ! media.id || media.id !== id ) {
			additionalAttributes = {
				width: undefined,
				height: undefined,
				sizeSlug: DEFAULT_SIZE_SLUG,
			};
		} else {
			// Keep the same url when selecting the same file, so "Image Size" option is not changed.
			additionalAttributes = { url };
		}

		this.props.setAttributes( {
			...mediaAttributes,
			...additionalAttributes,
		} );
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

	getIcon( iconType ) {
		let iconStyle;
		switch ( iconType ) {
			case ICON_TYPE.RETRY:
				return <Icon icon={ SvgIconRetry } { ...styles.iconRetry } />;
			case ICON_TYPE.PLACEHOLDER:
				iconStyle = this.props.getStylesFromColorScheme(
					styles.iconPlaceholder,
					styles.iconPlaceholderDark
				);
				break;
			case ICON_TYPE.UPLOAD:
				iconStyle = this.props.getStylesFromColorScheme(
					styles.iconUpload,
					styles.iconUploadDark
				);
				break;
		}
		return <Icon icon={ icon } { ...iconStyle } />;
	}

	render() {
		const { attributes, isSelected, image, imageSizes } = this.props;
		const {
			align,
			url,
			height,
			width,
			alt,
			href,
			id,
			linkTarget,
			sizeSlug,
		} = attributes;

		const sizeOptions = map( imageSizes, ( { name, slug } ) => ( {
			value: slug,
			name,
		} ) );
		const sizeOptionsValid = find( sizeOptions, [
			'value',
			DEFAULT_SIZE_SLUG,
		] );

		const getToolbarEditButton = ( open ) => (
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						title={ __( 'Edit image' ) }
						icon={ replace }
						onClick={ open }
					/>
				</ToolbarGroup>
				<BlockAlignmentToolbar
					value={ align }
					onChange={ this.updateAlignment }
				/>
			</BlockControls>
		);

		const getInspectorControls = () => (
			<InspectorControls>
				<PanelBody title={ __( 'Image settings' ) }>
					<TextControl
						icon={ link }
						label={ __( 'Link To' ) }
						value={ href || '' }
						valuePlaceholder={ __( 'Add URL' ) }
						onChange={ this.onSetLinkDestination }
						autoCapitalize="none"
						autoCorrect={ false }
						keyboardType="url"
					/>
					<ToggleControl
						icon={ external }
						label={ __( 'Open in new tab' ) }
						checked={ linkTarget === '_blank' }
						onChange={ this.onSetNewTab }
					/>
					{ image && sizeOptionsValid && (
						<CycleSelectControl
							icon={ 'editor-expand' }
							label={ __( 'Size' ) }
							value={ sizeSlug || DEFAULT_SIZE_SLUG }
							onChangeValue={ ( newValue ) =>
								this.onSetSizeSlug( newValue )
							}
							options={ sizeOptions }
						/>
					) }
					<TextControl
						icon={ textColor }
						label={ __( 'Alt Text' ) }
						value={ alt || '' }
						valuePlaceholder={ __( 'None' ) }
						onChangeValue={ this.updateAlt }
					/>
				</PanelBody>
			</InspectorControls>
		);

		if ( ! url ) {
			return (
				<View style={ { flex: 1 } }>
					<MediaPlaceholder
						allowedTypes={ [ MEDIA_TYPE_IMAGE ] }
						onSelect={ this.onSelectMediaUploadOption }
						icon={ this.getIcon( ICON_TYPE.PLACEHOLDER ) }
						onFocus={ this.props.onFocus }
					/>
				</View>
			);
		}

		const alignToFlex = {
			left: 'flex-start',
			center: 'center',
			right: 'flex-end',
			full: 'center',
			wide: 'center',
		};

		const imageContainerHeight =
			Dimensions.get( 'window' ).width / IMAGE_ASPECT_RATIO;

		const editImageComponent = ( { open, mediaOptions } ) => (
			<TouchableWithoutFeedback onPress={ open }>
				<View style={ styles.editContainer }>
					<View style={ styles.edit }>
						{ mediaOptions() }
						<Icon
							size={ 16 }
							icon={ SvgIconCustomize }
							{ ...styles.iconCustomise }
						/>
					</View>
				</View>
			</TouchableWithoutFeedback>
		);

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
					{ ! this.state.isCaptionSelected &&
						getToolbarEditButton( openMediaOptions ) }
					<MediaUploadProgress
						height={ height }
						width={ width }
						coverUrl={ url }
						mediaId={ id }
						onUpdateMediaProgress={ this.updateMediaProgress }
						onFinishMediaUploadWithSuccess={
							this.finishMediaUploadWithSuccess
						}
						onFinishMediaUploadWithFailure={
							this.finishMediaUploadWithFailure
						}
						onMediaUploadStateReset={ this.mediaUploadStateReset }
						renderContent={ ( {
							isUploadInProgress,
							isUploadFailed,
							finalWidth,
							finalHeight,
							imageWidthWithinContainer,
							retryMessage,
						} ) => {
							const opacity = isUploadInProgress ? 0.3 : 1;
							const imageBorderOnSelectedStyle =
								isSelected &&
								! (
									isUploadInProgress ||
									isUploadFailed ||
									this.state.isCaptionSelected
								)
									? styles.imageBorder
									: '';

							const iconRetryContainer = (
								<View style={ styles.modalIcon }>
									{ this.getIcon( ICON_TYPE.RETRY ) }
								</View>
							);

							return (
								<View
									style={ {
										flex: 1,
										// only set alignSelf if an image exists because alignSelf causes the placeholder
										// to disappear when an aligned image can't be downloaded
										// https://github.com/wordpress-mobile/gutenberg-mobile/issues/1592
										alignSelf:
											imageWidthWithinContainer &&
											alignToFlex[ align ],
									} }
								>
									{ ! imageWidthWithinContainer && (
										<View
											style={ [
												this.props.getStylesFromColorScheme(
													styles.imageContainerUpload,
													styles.imageContainerUploadDark
												),
												{
													height: imageContainerHeight,
												},
											] }
										>
											<View
												style={
													styles.imageUploadingIconContainer
												}
											>
												{ this.getIcon(
													ICON_TYPE.UPLOAD
												) }
											</View>
										</View>
									) }
									<ImageBackground
										accessible={ true }
										disabled={ ! isSelected }
										accessibilityLabel={ alt }
										accessibilityHint={ __(
											'Double tap and hold to edit'
										) }
										accessibilityRole={ 'imagebutton' }
										style={ [
											imageBorderOnSelectedStyle,
											{
												width: finalWidth,
												height: finalHeight,
												opacity,
											},
										] }
										resizeMethod="scale"
										source={ { uri: url } }
										key={ url }
									>
										{ isUploadFailed && (
											<View
												style={ [
													styles.imageContainer,
													{
														flex: 1,
														backgroundColor:
															'rgba(0, 0, 0, 0.5)',
													},
												] }
											>
												{ iconRetryContainer }
												<Text
													style={
														styles.uploadFailedText
													}
												>
													{ retryMessage }
												</Text>
											</View>
										) }
										{ isSelected &&
											! isUploadInProgress &&
											! isUploadFailed &&
											finalWidth &&
											finalHeight && (
												<MediaEdit
													allowedTypes={ [
														MEDIA_TYPE_IMAGE,
													] }
													onSelect={
														this
															.onSelectMediaUploadOption
													}
													source={ { uri: url } }
													openReplaceMediaOptions={
														openMediaOptions
													}
													render={
														editImageComponent
													}
												/>
											) }
									</ImageBackground>
								</View>
							);
						} }
					/>
					<BlockCaption
						clientId={ this.props.clientId }
						isSelected={ this.state.isCaptionSelected }
						accessible={ true }
						accessibilityLabelCreator={ ( caption ) =>
							isEmpty( caption )
								? /* translators: accessibility text. Empty image caption. */
								  'Image caption. Empty'
								: sprintf(
										/* translators: accessibility text. %s: image caption. */
										__( 'Image caption. %s' ),
										caption
								  )
						}
						onFocus={ this.onFocusCaption }
						onBlur={ this.props.onBlur } // always assign onBlur as props
						insertBlocksAfter={ this.props.insertBlocksAfter }
					/>
				</View>
			</TouchableWithoutFeedback>
		);

		return (
			<MediaUpload
				allowedTypes={ [ MEDIA_TYPE_IMAGE ] }
				onSelect={ this.onSelectMediaUploadOption }
				render={ ( { open, getMediaOptions } ) => {
					return getImageComponent( open, getMediaOptions );
				} }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select, props ) => {
		const { getMedia } = select( 'core' );
		const { getSettings } = select( 'core/block-editor' );
		const {
			attributes: { id, url },
			isSelected,
		} = props;
		const { imageSizes } = getSettings();

		const shouldGetMedia =
			id && isSelected && getProtocol( url ) !== 'file:';
		return {
			image: shouldGetMedia ? getMedia( id ) : null,
			imageSizes,
		};
	} ),
	withPreferredColorScheme,
] )( ImageEdit );
