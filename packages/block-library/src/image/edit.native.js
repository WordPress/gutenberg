/**
 * External dependencies
 */
import React from 'react';
import { View, TouchableWithoutFeedback } from 'react-native';
import { isEmpty, get, find, map } from 'lodash';

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
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { getProtocol, hasQueryArg } from '@wordpress/url';
import { doAction, hasAction } from '@wordpress/hooks';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import {
	image as placeholderIcon,
	textColor,
	replace,
	expand,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import {
	getUpdatedLinkTargetSettings,
	getImageSizeAttributes,
	getUrl,
} from './utils';

import {
	LINK_DESTINATION_CUSTOM,
	LINK_DESTINATION_ATTACHMENT,
	DEFAULT_SIZE_SLUG,
	LINK_DESTINATION_MEDIA,
} from './constants';

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
		this.accessibilityLabelCreator = this.accessibilityLabelCreator.bind(
			this
		);
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
		const { image, attributes, context, setAttributes } = this.props;
		const { inheritedAttributes } = attributes;
		if ( ! previousProps.image && image ) {
			const url = getUrlForSlug( image, attributes ) || image.source_url;
			setAttributes( { url } );
		}
		// TODO use `useParentAttributes` instead after refactor to function component
		if (
			previousProps.image !== image ||
			previousProps.context?.linkTo !== context?.linkTo
		) {
			if ( inheritedAttributes?.linkDestination && image ) {
				const href = getUrl( image, context?.linkTo );
				if ( href !== previousProps.attributes.href ) {
					setAttributes( {
						href,
						linkDestination: context?.linkTo,
					} );
				}
			}
		}
		if ( previousProps.context?.linkTarget !== context?.linkTarget ) {
			if ( inheritedAttributes.linkTarget ) {
				setAttributes( {
					linkTarget: context?.linkTarget,
				} );
			}
		}

		if ( previousProps.context?.sizeSlug !== context?.sizeSlug ) {
			if ( inheritedAttributes.sizeSlug ) {
				const sizeAttributes = getImageSizeAttributes(
					image,
					context?.sizeSlug
				);

				setAttributes( {
					...sizeAttributes,
				} );
			}
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

	onSetLinkDestination( href ) {
		const { inheritedAttributes } = this.props.attributes;
		this.props.setAttributes( {
			inheritedAttributes: {
				...inheritedAttributes,
				linkDestination: false,
				linkTarget: false,
			},
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
		const { image, setAttributes } = this.props;
		const { inheritedAttributes } = this.props.attributes;

		const url = getUrlForSlug( image, { sizeSlug } );
		if ( ! url ) {
			return null;
		}
		setAttributes( {
			url,
			width: undefined,
			height: undefined,
			sizeSlug,
			...( inheritedAttributes?.sizeSlug
				? {
						inheritedAttributes: {
							...inheritedAttributes,
							sizeSlug: false,
						},
				  }
				: {} ),
		} );
	}

	onSelectMediaUploadOption( media ) {
		const { id, url, linkDestination: destination } = this.props.attributes;
		const { context } = this.props;
		const mediaAttributes = {
			id: media.id,
			url: media.url,
			caption: media.caption,
		};

		// Check if default link setting, or the one inherited from parent block should be used.
		const linkDestination = context?.linkTo ? context.linkTo : destination;

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

		let href;
		switch ( linkDestination ) {
			case LINK_DESTINATION_MEDIA:
				href = media.url;
				break;
			case LINK_DESTINATION_ATTACHMENT:
				href = media.link;
				break;
		}
		mediaAttributes.href = href;

		if ( ! isEmpty( context ) ) {
			const parentSizeAttributes = getImageSizeAttributes(
				media,
				context.sizeSlug
			);

			if ( context.linkTarget ) {
				additionalAttributes.linkTarget = context.linkTarget;
			}

			additionalAttributes = {
				...additionalAttributes,
				inheritedAttributes: {
					linkDestination: true,
					linkTarget: true,
					sizeSlug: true,
				},
				...parentSizeAttributes,
			};
		}

		this.props.setAttributes( {
			...mediaAttributes,
			...additionalAttributes,
			linkDestination,
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

	getLinkSettings() {
		const { isLinkSheetVisible } = this.state;
		const {
			attributes: {
				href: url,
				inheritedAttributes,
				...unMappedAttributes
			},
			setAttributes,
		} = this.props;
		const additionalAttributes = {
			inheritedAttributes: {
				...inheritedAttributes,
				linkDestination: false,
				linkTarget: false,
			},
			linkDestination: LINK_DESTINATION_CUSTOM,
		};
		const mappedAttributes = { ...unMappedAttributes, url };
		const setMappedAttributes = ( { url: href, ...restAttributes } ) =>
			href === undefined
				? setAttributes( restAttributes, ...additionalAttributes )
				: setAttributes( {
						...restAttributes,
						href,
						...additionalAttributes,
				  } );

		const options = {
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

		return (
			<LinkSettingsNavigation
				isVisible={ isLinkSheetVisible }
				attributes={ mappedAttributes }
				onClose={ this.dismissSheet }
				setAttributes={ setMappedAttributes }
				withBottomSheet={ false }
				hasPicker
				options={ options }
				showIcon={ false }
			/>
		);
	}

	render() {
		const { isCaptionSelected } = this.state;
		const {
			attributes,
			isSelected,
			image,
			imageSizes,
			clientId,
			isGallery,
			imageCrop,
		} = this.props;
		const { align, url, alt, id, sizeSlug, className } = attributes;
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
				<PanelBody title={ __( 'Image settings' ) } />
				<PanelBody style={ styles.panelBody }>
					<BlockStyles clientId={ clientId } url={ url } />
				</PanelBody>
				<PanelBody>
					{ image && sizeOptionsValid && (
						<CycleSelectControl
							icon={ expand }
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
				<PanelBody title={ __( 'Link Settings' ) }>
					{ this.getLinkSettings( true ) }
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

		const additionalImageProps = isGallery
			? {
					height: '100%',
					resizeMode: imageCrop ? 'cover' : 'contain',
			  }
			: {};

		const getImageComponent = ( openMediaOptions, getMediaOptions ) => (
			<>
				<TouchableWithoutFeedback
					accessible={ ! isSelected }
					onPress={ this.onImagePressed }
					onLongPress={ openMediaOptions }
					disabled={ ! isSelected }
				>
					<View style={ styles.content }>
						{ getInspectorControls() }
						{ getMediaOptions() }
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
									<View
										style={
											this.props.isGallery &&
											styles.isGallery
										}
									>
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
											shapeStyle={ styles[ className ] }
											width={ this.getWidth() }
											{ ...additionalImageProps }
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
		const { getMedia } = select( 'core' );
		const { getSettings } = select( 'core/block-editor' );
		const {
			attributes: { id, url },
			isSelected,
			context,
		} = props;
		const { imageSizes } = getSettings();
		const isNotFileUrl = id && getProtocol( url ) !== 'file:';
		const { linkTo: parentLinkDestination, sizeSlug: parentSizeSlug } =
			context || {};

		const shouldGetMedia =
			( ( isSelected || parentLinkDestination || parentSizeSlug ) &&
				isNotFileUrl ) ||
			// Edge case to update the image after uploading if the block gets unselected
			// Check if it's the original image and not the resized one with queryparams
			( ! isSelected &&
				isNotFileUrl &&
				url &&
				! hasQueryArg( url, 'w' ) );
		return {
			image: shouldGetMedia ? getMedia( id ) : null,
			imageSizes,
		};
	} ),
	withPreferredColorScheme,
] )( ImageEdit );
