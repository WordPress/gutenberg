/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback } from 'react-native';
import { isEmpty, get, find, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import {
	requestMediaImport,
	mediaUploadSync,
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
	requestImageFullscreenPreview,
	setFeaturedImage,
	checkIfFeaturedImage,
	subscribeFeaturedImageIdCurrent,
} from '@wordpress/react-native-bridge';
import {
	CycleSelectControl,
	Icon,
	PanelBody,
	TextControl,
	ToolbarButton,
	ToolbarGroup,
	Image,
	WIDE_ALIGNMENTS,
	LinkSettingsNavigation,
	BottomSheet,
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
	BlockStyles,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { getProtocol, hasQueryArg } from '@wordpress/url';
import { doAction, hasAction } from '@wordpress/hooks';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import {
	image as placeholderIcon,
	textColor,
	replace,
	expand,
} from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import { getUpdatedLinkTargetSettings } from './utils';

import { LINK_DESTINATION_CUSTOM } from './constants';

const getUrlForSlug = ( image, { sizeSlug } ) => {
	return get( image, [ 'media_details', 'sizes', sizeSlug, 'source_url' ] );
};

export class ImageEdit extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			isCaptionSelected: false,
			isFeaturedImage: false,
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
		this.featuredImageIdCurrent = this.featuredImageIdCurrent.bind( this );
		this.updateAlt = this.updateAlt.bind( this );
		this.updateImageURL = this.updateImageURL.bind( this );
		this.onSetLinkDestination = this.onSetLinkDestination.bind( this );
		this.onSetNewTab = this.onSetNewTab.bind( this );
		this.onSetSizeSlug = this.onSetSizeSlug.bind( this );
		this.onImagePressed = this.onImagePressed.bind( this );
		this.onSetFeatured = this.onSetFeatured.bind( this );
		this.onRemoveFeatured = this.onRemoveFeatured.bind( this );
		this.onFocusCaption = this.onFocusCaption.bind( this );
		this.updateAlignment = this.updateAlignment.bind( this );
		this.accessibilityLabelCreator = this.accessibilityLabelCreator.bind(
			this
		);
		this.setMappedAttributes = this.setMappedAttributes.bind( this );
		this.onSizeChangeValue = this.onSizeChangeValue.bind( this );

		this.linkSettingsOptions = {
			url: {
				label: __( 'Image Link URL' ),
				placeholder: __( 'Add URL' ),
				autoFocus: false,
				autoFill: true,
			},
			openInNewTab: {
				label: __( 'Open in new tab' ),
			},
			linkRel: {
				label: __( 'Link Rel' ),
				placeholder: __( 'None' ),
			},
		};

		this.sizeOptions = map( this.props.imageSizes, ( { name, slug } ) => ( {
			value: slug,
			name,
		} ) );
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

		// Check whether an image is featured when the editor first loads.
		if ( attributes.id ) {
			checkIfFeaturedImage( attributes.id );
		}

		this.addFeaturedImageIdListener();
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

		this.removeFeaturedImageIdListener();
	}

	componentDidUpdate( previousProps ) {
		const { image, attributes } = this.props;

		if ( ! previousProps.image && this.props.image ) {
			const url = getUrlForSlug( image, attributes ) || image.source_url;
			this.props.setAttributes( { url } );
		}

		// Check whether an image is featured when changes happen, such as when image is replaced within block.
		if ( attributes.id ) {
			checkIfFeaturedImage( attributes.id );
		}
	}

	static getDerivedStateFromProps( props, state ) {
		// Avoid a UI flicker in the toolbar by insuring that isCaptionSelected
		// is updated immediately any time the isSelected prop becomes false
		return {
			isCaptionSelected: props.isSelected && state.isCaptionSelected,
		};
	}

	accessibilityLabelCreator( caption ) {
		return isEmpty( caption )
			? /* translators: accessibility text. Empty image caption. */
			  'Image caption. Empty'
			: sprintf(
					/* translators: accessibility text. %s: image caption. */
					__( 'Image caption. %s' ),
					caption
			  );
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
		const extraUpdatedAttributes = Object.values(
			WIDE_ALIGNMENTS.alignments
		).includes( nextAlign )
			? { width: undefined, height: undefined }
			: {};
		this.props.setAttributes( {
			...extraUpdatedAttributes,
			align: nextAlign,
		} );
	}

	onSetFeatured() {
		const { attributes, closeSettingsBottomSheet } = this.props;
		setFeaturedImage( attributes.id );
		closeSettingsBottomSheet();
	}

	onRemoveFeatured() {
		setFeaturedImage( 0 );
	}

	featuredImageIdCurrent( payload ) {
		const { attributes } = this.props;

		const featuredImageId = payload.featuredImageId;

		if ( featuredImageId === attributes.id ) {
			this.setState( {
				isFeaturedImage: true,
			} );
		} else {
			this.setState( {
				isFeaturedImage: false,
			} );
		}
	}

	addFeaturedImageIdListener() {
		//if we already have a subscription not worth doing it again
		if ( this.subscriptionParentFeaturedImageIdCurrent ) {
			return;
		}
		this.subscriptionParentFeaturedImageIdCurrent = subscribeFeaturedImageIdCurrent(
			( payload ) => {
				this.featuredImageIdCurrent( payload );
			}
		);
	}

	removeFeaturedImageIdListener() {
		if ( this.subscriptionParentFeaturedImageIdCurrent ) {
			this.subscriptionParentFeaturedImageIdCurrent.remove();
		}
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
		const {
			attributes: { id, url },
			imageDefaultSize,
		} = this.props;

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
				sizeSlug: imageDefaultSize,
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

	getPlaceholderIcon() {
		return (
			<Icon
				icon={ placeholderIcon }
				{ ...this.props.getStylesFromColorScheme(
					styles.iconPlaceholder,
					styles.iconPlaceholderDark
				) }
			/>
		);
	}

	getWidth() {
		const { attributes } = this.props;
		const { align, width } = attributes;

		return Object.values( WIDE_ALIGNMENTS.alignments ).includes( align )
			? '100%'
			: width;
	}

	setMappedAttributes( { url: href, ...restAttributes } ) {
		const { setAttributes } = this.props;
		return href === undefined
			? setAttributes( restAttributes )
			: setAttributes( { ...restAttributes, href } );
	}

	getLinkSettings() {
		const { isLinkSheetVisible } = this.state;
		const {
			attributes: { href: url, ...unMappedAttributes },
		} = this.props;

		const mappedAttributes = { ...unMappedAttributes, url };

		return (
			<LinkSettingsNavigation
				isVisible={ isLinkSheetVisible }
				url={ mappedAttributes.url }
				rel={ mappedAttributes.rel }
				label={ mappedAttributes.label }
				linkTarget={ mappedAttributes.linkTarget }
				onClose={ this.dismissSheet }
				setAttributes={ this.setMappedAttributes }
				withBottomSheet={ false }
				hasPicker
				options={ this.linkSettingsOptions }
				showIcon={ false }
			/>
		);
	}

	onSizeChangeValue( newValue ) {
		this.onSetSizeSlug( newValue );
	}

	render() {
		const { isCaptionSelected, isFeaturedImage } = this.state;
		const {
			attributes,
			isSelected,
			image,
			clientId,
			imageDefaultSize,
			getStylesFromColorScheme,
		} = this.props;
		const { align, url, alt, id, sizeSlug, className } = attributes;

		const sizeOptionsValid = find( this.sizeOptions, [
			'value',
			imageDefaultSize,
		] );

		const featuredButtonStyle = getStylesFromColorScheme(
			styles.featuredButton,
			styles.featuredButtonDark
		);

		const setFeaturedButtonStyle = getStylesFromColorScheme(
			styles.setFeaturedButton,
			styles.setFeaturedButtonDark
		);

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
				<PanelBody title={ __( 'Image settings' ) } />
				<PanelBody style={ styles.panelBody }>
					<BlockStyles clientId={ clientId } url={ url } />
				</PanelBody>
				<PanelBody>
					{ image && sizeOptionsValid && (
						<CycleSelectControl
							icon={ expand }
							label={ __( 'Size' ) }
							value={ sizeSlug || imageDefaultSize }
							onChangeValue={ this.onSizeChangeValue }
							options={ this.sizeOptions }
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
				<PanelBody title={ __( 'Link Settings' ) }>
					{ this.getLinkSettings( true ) }
				</PanelBody>
				<PanelBody>
					{ isFeaturedImage ? (
						<BottomSheet.Cell
							label={ __( 'Remove as Featured Image ' ) }
							labelStyle={ [
								featuredButtonStyle,
								styles.removeFeaturedButton,
							] }
							onPress={ this.onRemoveFeatured }
						/>
					) : (
						<BottomSheet.Cell
							label={ __( 'Set as Featured Image ' ) }
							labelStyle={ [
								featuredButtonStyle,
								setFeaturedButtonStyle,
							] }
							onPress={ this.onSetFeatured }
						/>
					) }
				</PanelBody>
			</InspectorControls>
		);

		if ( ! url ) {
			return (
				<View style={ styles.content }>
					<MediaPlaceholder
						allowedTypes={ [ MEDIA_TYPE_IMAGE ] }
						onSelect={ this.onSelectMediaUploadOption }
						icon={ this.getPlaceholderIcon() }
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

		const getImageComponent = ( openMediaOptions, getMediaOptions ) => (
			<>
				<TouchableWithoutFeedback
					accessible={ ! isSelected }
					onPress={ this.onImagePressed }
					onLongPress={ openMediaOptions }
					disabled={ ! isSelected }
				>
					<View style={ styles.content }>
						{ isSelected && getInspectorControls() }
						{ isSelected && getMediaOptions() }
						{ ! this.state.isCaptionSelected &&
							getToolbarEditButton( openMediaOptions ) }
						{ this.state.isFeaturedImage }
						<MediaUploadProgress
							coverUrl={ url }
							mediaId={ id }
							onUpdateMediaProgress={ this.updateMediaProgress }
							onFinishMediaUploadWithSuccess={
								this.finishMediaUploadWithSuccess
							}
							onFinishMediaUploadWithFailure={
								this.finishMediaUploadWithFailure
							}
							onMediaUploadStateReset={
								this.mediaUploadStateReset
							}
							renderContent={ ( {
								isUploadInProgress,
								isUploadFailed,
								retryMessage,
							} ) => {
								return (
									<Image
										align={ align && alignToFlex[ align ] }
										alt={ alt }
										isSelected={
											isSelected && ! isCaptionSelected
										}
										isFeaturedImage={ isFeaturedImage }
										isUploadFailed={ isUploadFailed }
										isUploadInProgress={
											isUploadInProgress
										}
										onSelectMediaUploadOption={
											this.onSelectMediaUploadOption
										}
										openMediaOptions={ openMediaOptions }
										retryMessage={ retryMessage }
										url={ url }
										shapeStyle={ styles[ className ] }
										width={ this.getWidth() }
									/>
								);
							} }
						/>
					</View>
				</TouchableWithoutFeedback>
				<BlockCaption
					clientId={ this.props.clientId }
					isSelected={ this.state.isCaptionSelected }
					accessible
					accessibilityLabelCreator={ this.accessibilityLabelCreator }
					onFocus={ this.onFocusCaption }
					onBlur={ this.props.onBlur } // always assign onBlur as props
					insertBlocksAfter={ this.props.insertBlocksAfter }
				/>
			</>
		);

		return (
			<MediaUpload
				allowedTypes={ [ MEDIA_TYPE_IMAGE ] }
				isReplacingMedia={ true }
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
		const { getMedia } = select( coreStore );
		const { getSettings } = select( blockEditorStore );
		const {
			attributes: { id, url },
			isSelected,
		} = props;
		const { imageSizes, imageDefaultSize } = getSettings();
		const isNotFileUrl = id && getProtocol( url ) !== 'file:';

		const shouldGetMedia =
			( isSelected && isNotFileUrl ) ||
			// Edge case to update the image after uploading if the block gets unselected
			// Check if it's the original image and not the resized one with queryparams
			( ! isSelected &&
				isNotFileUrl &&
				url &&
				! hasQueryArg( url, 'w' ) );
		return {
			image: shouldGetMedia ? getMedia( id ) : null,
			imageSizes,
			imageDefaultSize,
		};
	} ),
	withDispatch( ( dispatch ) => {
		return {
			closeSettingsBottomSheet() {
				dispatch( 'core/edit-post' ).closeGeneralSidebar();
			},
		};
	} ),
	withPreferredColorScheme,
] )( ImageEdit );
