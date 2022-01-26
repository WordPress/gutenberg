/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback } from 'react-native';
import { useRoute } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { Component, useEffect } from '@wordpress/element';
import {
	requestMediaImport,
	mediaUploadSync,
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
	requestImageFullscreenPreview,
	setFeaturedImage,
} from '@wordpress/react-native-bridge';
import {
	Icon,
	PanelBody,
	ToolbarButton,
	ToolbarGroup,
	Image,
	WIDE_ALIGNMENTS,
	LinkSettingsNavigation,
	BottomSheet,
	BottomSheetTextControl,
	BottomSheetSelectControl,
	FooterMessageControl,
	FooterMessageLink,
	Badge,
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
	blockSettingsScreens,
} from '@wordpress/block-editor';
import { __, _x, sprintf } from '@wordpress/i18n';
import { getProtocol, hasQueryArg } from '@wordpress/url';
import { doAction, hasAction } from '@wordpress/hooks';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import {
	image as placeholderIcon,
	replace,
	fullscreen,
	textColor,
} from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { store as editPostStore } from '@wordpress/edit-post';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import { getUpdatedLinkTargetSettings } from './utils';

import {
	LINK_DESTINATION_NONE,
	LINK_DESTINATION_CUSTOM,
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA,
	MEDIA_ID_NO_FEATURED_IMAGE_SET,
} from './constants';

const getUrlForSlug = ( image, sizeSlug ) => {
	if ( ! sizeSlug ) {
		return undefined;
	}
	return image?.media_details?.sizes?.[ sizeSlug ]?.source_url;
};

function LinkSettings( {
	attributes,
	image,
	isLinkSheetVisible,
	setMappedAttributes,
} ) {
	const route = useRoute();
	const { href: url, label, linkDestination, linkTarget, rel } = attributes;

	// Persist attributes passed from child screen
	useEffect( () => {
		const { inputValue: newUrl } = route.params || {};

		let newLinkDestination;
		switch ( newUrl ) {
			case attributes.url:
				newLinkDestination = LINK_DESTINATION_MEDIA;
				break;
			case image?.link:
				newLinkDestination = LINK_DESTINATION_ATTACHMENT;
				break;
			case '':
				newLinkDestination = LINK_DESTINATION_NONE;
				break;
			default:
				newLinkDestination = LINK_DESTINATION_CUSTOM;
				break;
		}

		setMappedAttributes( {
			url: newUrl,
			linkDestination: newLinkDestination,
		} );
	}, [ route.params?.inputValue ] );

	let valueMask;
	switch ( linkDestination ) {
		case LINK_DESTINATION_MEDIA:
			valueMask = __( 'Media File' );
			break;
		case LINK_DESTINATION_ATTACHMENT:
			valueMask = __( 'Attachment Page' );
			break;
		case LINK_DESTINATION_CUSTOM:
			valueMask = __( 'Custom URL' );
			break;
		default:
			valueMask = __( 'None' );
			break;
	}

	const linkSettingsOptions = {
		url: {
			valueMask,
			autoFocus: false,
			autoFill: false,
		},
		openInNewTab: {
			label: __( 'Open in new tab' ),
		},
		linkRel: {
			label: __( 'Link Rel' ),
			placeholder: _x( 'None', 'Link rel attribute value placeholder' ),
		},
	};

	return (
		<PanelBody title={ __( 'Link Settings' ) }>
			<LinkSettingsNavigation
				isVisible={ isLinkSheetVisible }
				url={ url }
				rel={ rel }
				label={ label }
				linkTarget={ linkTarget }
				setAttributes={ setMappedAttributes }
				withBottomSheet={ false }
				hasPicker
				options={ linkSettingsOptions }
				showIcon={ false }
				onLinkCellPressed={ ( { navigation } ) => {
					navigation.navigate(
						blockSettingsScreens.imageLinkDestinations,
						{
							inputValue: attributes.href,
							linkDestination: attributes.linkDestination,
							imageUrl: attributes.url,
							attachmentPageUrl: image?.link,
						}
					);
				} }
			/>
		</PanelBody>
	);
}

export class ImageEdit extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			isCaptionSelected: false,
			isUploadInProgress: false,
			isUploadFailed: false,
		};

		this.replacedFeaturedImage = false;

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
		this.updateImageURL = this.updateImageURL.bind( this );
		this.onSetNewTab = this.onSetNewTab.bind( this );
		this.onSetSizeSlug = this.onSetSizeSlug.bind( this );
		this.onImagePressed = this.onImagePressed.bind( this );
		this.onSetFeatured = this.onSetFeatured.bind( this );
		this.onFocusCaption = this.onFocusCaption.bind( this );
		this.updateAlignment = this.updateAlignment.bind( this );
		this.accessibilityLabelCreator = this.accessibilityLabelCreator.bind(
			this
		);
		this.setMappedAttributes = this.setMappedAttributes.bind( this );
		this.onSizeChangeValue = this.onSizeChangeValue.bind( this );
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
		const {
			image,
			attributes,
			setAttributes,
			featuredImageId,
		} = this.props;
		if ( ! previousProps.image && image ) {
			const url =
				getUrlForSlug( image, attributes?.sizeSlug ) ||
				image.source_url;
			setAttributes( { url } );
		}

		const { id } = attributes;
		const { id: previousId } = previousProps.attributes;

		// The media changed and the previous media was set as the Featured Image,
		// we must keep track of the previous media's featured status to act on it
		// once the new media has a finalized ID.
		if (
			!! id &&
			id !== previousId &&
			!! featuredImageId &&
			featuredImageId === previousId
		) {
			this.replacedFeaturedImage = true;
		}

		// The media changed and now has a finalized ID (e.g. upload completed), we
		// should attempt to replace the featured image if applicable.
		if (
			this.replacedFeaturedImage &&
			!! image &&
			this.canImageBeFeatured()
		) {
			this.replacedFeaturedImage = false;
			setFeaturedImage( id );
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
		// Checks if caption is empty.
		return ( typeof caption === 'string' && caption.trim().length === 0 ) ||
			caption === undefined ||
			caption === null
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
		this.setState( { isUploadInProgress: false, isUploadFailed: false } );
	}

	finishMediaUploadWithFailure( payload ) {
		const { setAttributes } = this.props;

		setAttributes( { id: payload.mediaId } );
		this.setState( { isUploadInProgress: false, isUploadFailed: true } );
	}

	mediaUploadStateReset() {
		const { setAttributes } = this.props;

		setAttributes( { id: null, url: null } );
		this.setState( { isUploadInProgress: false, isUploadFailed: false } );
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

	onSetNewTab( value ) {
		const updatedLinkTarget = getUpdatedLinkTargetSettings(
			value,
			this.props.attributes
		);
		this.props.setAttributes( updatedLinkTarget );
	}

	onSetSizeSlug( sizeSlug ) {
		const { image, setAttributes } = this.props;

		const url = getUrlForSlug( image, sizeSlug );
		if ( ! url ) {
			return null;
		}
		setAttributes( {
			url,
			width: undefined,
			height: undefined,
			sizeSlug,
		} );
	}

	onSelectMediaUploadOption( media ) {
		const { imageDefaultSize } = this.props;
		const { id, url, destination } = this.props.attributes;
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

		let href;
		switch ( destination ) {
			case LINK_DESTINATION_MEDIA:
				href = media.url;
				break;
			case LINK_DESTINATION_ATTACHMENT:
				href = media.link;
				break;
		}
		mediaAttributes.href = href;

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

	setMappedAttributes( { url: href, linkDestination, ...restAttributes } ) {
		const { setAttributes } = this.props;
		if ( ! href && ! linkDestination ) {
			linkDestination = LINK_DESTINATION_NONE;
		} else if ( ! linkDestination ) {
			linkDestination = LINK_DESTINATION_CUSTOM;
		}

		return href === undefined || href === this.props.attributes.href
			? setAttributes( restAttributes )
			: setAttributes( {
					...restAttributes,
					linkDestination,
					href,
			  } );
	}

	getAltTextSettings() {
		const {
			attributes: { alt },
		} = this.props;

		const updateAlt = ( newAlt ) => {
			this.props.setAttributes( { alt: newAlt } );
		};

		return (
			<BottomSheetTextControl
				initialValue={ alt }
				onChange={ updateAlt }
				placeholder={ __( 'Add alt text' ) }
				label={ __( 'Alt Text' ) }
				icon={ textColor }
				footerNote={
					<>
						{ __(
							'Describe the purpose of the image. Leave empty if the image is purely decorative.'
						) }
						<FooterMessageLink
							href={
								'https://www.w3.org/WAI/tutorials/images/decision-tree/'
							}
							value={ __( 'What is alt text?' ) }
						/>
					</>
				}
			/>
		);
	}

	onSizeChangeValue( newValue ) {
		this.onSetSizeSlug( newValue );
	}

	onSetFeatured( mediaId ) {
		const { closeSettingsBottomSheet } = this.props;
		setFeaturedImage( mediaId );
		closeSettingsBottomSheet();
	}

	getFeaturedButtonPanel( isFeaturedImage ) {
		const { attributes, getStylesFromColorScheme } = this.props;

		const setFeaturedButtonStyle = getStylesFromColorScheme(
			styles.setFeaturedButton,
			styles.setFeaturedButtonDark
		);

		const removeFeaturedButton = () => (
			<BottomSheet.Cell
				label={ __( 'Remove as Featured Image' ) }
				labelStyle={ [
					setFeaturedButtonStyle,
					styles.removeFeaturedButton,
				] }
				cellContainerStyle={ styles.setFeaturedButtonCellContainer }
				separatorType={ 'none' }
				onPress={ () =>
					this.onSetFeatured( MEDIA_ID_NO_FEATURED_IMAGE_SET )
				}
			/>
		);

		const setFeaturedButton = () => (
			<BottomSheet.Cell
				label={ __( 'Set as Featured Image' ) }
				labelStyle={ setFeaturedButtonStyle }
				cellContainerStyle={ styles.setFeaturedButtonCellContainer }
				separatorType={ 'none' }
				onPress={ () => this.onSetFeatured( attributes.id ) }
			/>
		);

		return isFeaturedImage ? removeFeaturedButton() : setFeaturedButton();
	}

	/**
	 * Featured images must be set to a successfully uploaded self-hosted image,
	 * which has an ID.
	 *
	 * @return {boolean} Boolean indicating whether or not the current may be set as featured.
	 */
	canImageBeFeatured() {
		const {
			attributes: { id },
		} = this.props;
		return (
			typeof id !== 'undefined' &&
			! this.state.isUploadInProgress &&
			! this.state.isUploadFailed
		);
	}

	render() {
		const { isCaptionSelected } = this.state;
		const {
			attributes,
			isSelected,
			image,
			clientId,
			imageDefaultSize,
			context,
			featuredImageId,
			wasBlockJustInserted,
		} = this.props;
		const { align, url, alt, id, sizeSlug, className } = attributes;
		const hasImageContext = context
			? Object.keys( context ).length > 0
			: false;

		const imageSizes = Array.isArray( this.props.imageSizes )
			? this.props.imageSizes
			: [];
		// Only map available image sizes for the user to choose.
		const sizeOptions = imageSizes
			.filter( ( { slug } ) => getUrlForSlug( image, slug ) )
			.map( ( { name, slug } ) => ( { value: slug, label: name } ) );

		let selectedSizeOption = sizeSlug || imageDefaultSize;
		let sizeOptionsValid = sizeOptions.find(
			( option ) => option.value === selectedSizeOption
		);

		if ( ! sizeOptionsValid ) {
			// Default to 'full' size if the default large size is not available.
			sizeOptionsValid = sizeOptions.find(
				( option ) => option.value === 'full'
			);
			selectedSizeOption = 'full';
		}

		const canImageBeFeatured = this.canImageBeFeatured();
		const isFeaturedImage =
			canImageBeFeatured && featuredImageId === attributes.id;

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
						<BottomSheetSelectControl
							icon={ fullscreen }
							label={ __( 'Size' ) }
							options={ sizeOptions }
							onChange={ this.onSizeChangeValue }
							value={ selectedSizeOption }
						/>
					) }
					{ this.getAltTextSettings() }
				</PanelBody>
				<LinkSettings
					attributes={ this.props.attributes }
					image={ this.props.image }
					isLinkSheetVisible={ this.state.isLinkSheetVisible }
					setMappedAttributes={ this.setMappedAttributes }
				/>
				<PanelBody
					title={ __( 'Featured Image' ) }
					titleStyle={ styles.featuredImagePanelTitle }
				>
					{ canImageBeFeatured &&
						this.getFeaturedButtonPanel( isFeaturedImage ) }
					<FooterMessageControl
						label={ __(
							'Changes to featured image will not be affected by the undo/redo buttons.'
						) }
						cellContainerStyle={
							styles.setFeaturedButtonCellContainer
						}
					/>
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
						autoOpenMediaUpload={
							isSelected && wasBlockJustInserted
						}
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

		const additionalImageProps = {
			height: '100%',
			resizeMode: context?.imageCrop ? 'cover' : 'contain',
		};

		const imageContainerStyles = [
			context?.fixedHeight && styles.fixedHeight,
		];

		const getImageComponent = ( openMediaOptions, getMediaOptions ) => (
			<Badge label={ __( 'Featured' ) } show={ isFeaturedImage }>
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
									<View style={ imageContainerStyles }>
										<Image
											align={
												align && alignToFlex[ align ]
											}
											alt={ alt }
											isSelected={
												isSelected &&
												! isCaptionSelected
											}
											isUploadFailed={ isUploadFailed }
											isUploadInProgress={
												isUploadInProgress
											}
											onSelectMediaUploadOption={
												this.onSelectMediaUploadOption
											}
											openMediaOptions={
												openMediaOptions
											}
											retryMessage={ retryMessage }
											url={ url }
											shapeStyle={
												styles[ className ] || className
											}
											width={ this.getWidth() }
											{ ...( hasImageContext
												? additionalImageProps
												: {} ) }
										/>
									</View>
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
			</Badge>
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
		const { getSettings, wasBlockJustInserted } = select(
			blockEditorStore
		);
		const { getEditedPostAttribute } = select( 'core/editor' );
		const {
			attributes: { id, url },
			isSelected,
			clientId,
		} = props;
		const { imageSizes, imageDefaultSize } = getSettings();
		const isNotFileUrl = id && getProtocol( url ) !== 'file:';
		const featuredImageId = getEditedPostAttribute( 'featured_media' );

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
			featuredImageId,
			wasBlockJustInserted: wasBlockJustInserted(
				clientId,
				'inserter_menu'
			),
		};
	} ),
	withDispatch( ( dispatch ) => {
		return {
			closeSettingsBottomSheet() {
				dispatch( editPostStore ).closeGeneralSidebar();
			},
		};
	} ),
	withPreferredColorScheme,
] )( ImageEdit );
