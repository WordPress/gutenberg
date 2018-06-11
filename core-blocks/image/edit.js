/**
 * External dependencies
 */
import classnames from 'classnames';
import ResizableBox from 're-resizable';
import {
	get,
	isEmpty,
	map,
	pick,
	startCase,
	round,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, compose, Fragment } from '@wordpress/element';
import { getBlobByURL, revokeBlobURL } from '@wordpress/blob';
import {
	Button,
	ButtonGroup,
	IconButton,
	PanelBody,
	SelectControl,
	TextControl,
	TextareaControl,
	Toolbar,
	withNotices,
} from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import {
	RichText,
	BlockControls,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	BlockAlignmentToolbar,
	UrlInputButton,
	editorMediaUpload,
} from '@wordpress/editor';
import { withViewportMatch } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import './editor.scss';
import ImageSize from './image-size';
import { getEditorWidth, getPercentWidth } from './image-size';

/**
 * Module constants
 */
const MIN_SIZE = 20;

class ImageEdit extends Component {
	constructor() {
		super( ...arguments );
		this.updateAlt = this.updateAlt.bind( this );
		this.updateAlignment = this.updateAlignment.bind( this );
		this.onFocusCaption = this.onFocusCaption.bind( this );
		this.onImageClick = this.onImageClick.bind( this );
		this.onSelectImage = this.onSelectImage.bind( this );
		this.onSetHref = this.onSetHref.bind( this );
		this.updateImageURL = this.updateImageURL.bind( this );
		this.updateWidth = this.updateWidth.bind( this );
		this.updateHeight = this.updateHeight.bind( this );
		this.updateDimensions = this.updateDimensions.bind( this );

		this.state = {
			captionFocused: false,
		};
	}

	componentDidMount() {
		const { attributes, setAttributes } = this.props;
		const { id, url = '' } = attributes;

		if ( ! id && url.indexOf( 'blob:' ) === 0 ) {
			const file = getBlobByURL( url );

			if ( file ) {
				editorMediaUpload( {
					filesList: [ file ],
					onFileChange: ( [ image ] ) => {
						setAttributes( { ...image } );
					},
					allowedType: 'image',
				} );
			}
		}
	}

	componentDidUpdate( prevProps ) {
		const { id: prevID, url: prevUrl = '' } = prevProps.attributes;
		const { id, url = '' } = this.props.attributes;

		if ( ! prevID && prevUrl.indexOf( 'blob:' ) === 0 && id && url.indexOf( 'blob:' ) === -1 ) {
			revokeBlobURL( url );
		}
	}

	componentWillReceiveProps( { isSelected } ) {
		if ( ! isSelected && this.props.isSelected && this.state.captionFocused ) {
			this.setState( {
				captionFocused: false,
			} );
		}
	}

	onSelectImage( media ) {
		if ( ! media ) {
			this.props.setAttributes( {
				url: undefined,
				alt: undefined,
				id: undefined,
				caption: undefined,
			} );
			return;
		}

		const editorWidth = getEditorWidth();
		let src = media.url;
		let img = {};
		let percentWidth = 100;
		let sizesWidth = editorWidth;

		if ( media.sizes ) {
			// The "full" size is included in `sizes`.
			img = media.sizes.large || media.sizes.full;
			src = img.url;

			if ( img.width < editorWidth ) {
				// The "full" size may be narrower than 100%.
				sizesWidth = img.width;
				percentWidth = getPercentWidth( sizesWidth );
			}

			if ( img.srcset ) {
				img.sizes = this.getSizesAttr( sizesWidth );
			}
		} else {
			if ( media.width && media.width < editorWidth ) {
				percentWidth = getPercentWidth( media.width );
			}
		}

		this.props.setAttributes( {
			...pick( media, [ 'alt', 'id', 'caption' ] ),
			url: src,
			srcSet: img.srcset,
			sizes: img.sizes,
			width: undefined,
			height: undefined,
			'data-wp-percent-width': percentWidth,
		} );
	}

	onSetHref( value ) {
		this.props.setAttributes( { href: value } );
	}

	onFocusCaption() {
		if ( ! this.state.captionFocused ) {
			this.setState( {
				captionFocused: true,
			} );
		}
	}

	onImageClick() {
		if ( this.state.captionFocused ) {
			this.setState( {
				captionFocused: false,
			} );
		}
	}

	updateAlt( newAlt ) {
		this.props.setAttributes( { alt: newAlt } );
	}

	updateAlignment( nextAlign ) {
		const extraUpdatedAttributes = [ 'wide', 'full' ].indexOf( nextAlign ) !== -1 ?
			{ width: undefined, height: undefined } :
			{};
		this.props.setAttributes( { ...extraUpdatedAttributes, align: nextAlign } );
	}

	updateImageURL( url ) {
		this.props.setAttributes( { url, width: undefined, height: undefined } );
		this.updateSrcsetAndSizes( url );
	}

	updateWidth( width ) {
		width = parseInt( width, 10 );
		this.props.setAttributes( {
			width: width,
			'data-wp-percent-width': getPercentWidth( width ),
		} );
	}

	updateHeight( height ) {
		this.props.setAttributes( { height: parseInt( height, 10 ) } );
	}

	updateDimensions( width = undefined, height = undefined ) {
		return () => {
			this.props.setAttributes( {
				width: width,
				height: height,
				'data-wp-percent-width': getPercentWidth( width ) || 100,
			} );
		};
	}

	updateSrcsetAndSizes( url ) {
		const sizes = get( this.props.image, [ 'media_details', 'sizes' ], {} );

		if ( ! sizes.full ) {
			this.resetSrcsetAndSizes();
		}

		let imageData;
		const defaultImage = sizes.large || sizes.full;

		if ( defaultImage.source_url === url ) {
			imageData = defaultImage;
		} else if ( sizes.thumbnail && sizes.thumbnail.source_url === url ) {
			imageData = sizes.thumbnail;
		}

		if ( ! imageData || ! imageData.srcset ) {
			this.resetSrcsetAndSizes();
		} else {
			const editorWidth = getEditorWidth();
			let percentWidth = 100;
			let sizesWidth = editorWidth;

			if ( imageData.width < editorWidth ) {
				sizesWidth = imageData.width;
				percentWidth = getPercentWidth( sizesWidth );
			}

			this.props.setAttributes( {
				srcSet: imageData.srcset,
				sizes: this.getSizesAttr( sizesWidth ),
				'data-wp-percent-width': percentWidth,
			} );
		}
	}

	resetSrcsetAndSizes() {
		this.props.setAttributes( {
			srcSet: null,
			sizes: null,
			'data-wp-percent-width': 100,
		} );
	}

	getSizesAttr( width ) {
		return '(max-width: '.concat( width, 'px) 100vw, ', width, 'px' );
	}

	/**
	 * Helper function to test if aspect ratios for two images match.
	 *
	 * @param int fullWidth  Width of the image in pixels.
	 * @param int fullHeight Height of the image in pixels.
	 * @param int targetWidth  Width of the smaller image in pixels.
	 * @param int targetHeight Height of the smaller image in pixels.
	 * @return bool True if aspect ratios match within 1px. False if not.
	 */
	imageMatchesRatio( fullWidth, fullHeight, targetWidth, targetHeight ) {
		if ( ! fullWidth || ! fullHeight || ! targetWidth || ! targetHeight ) {
			return false;
		}

		const { width, height } = this.constrainImageDimensions( fullWidth, fullHeight, targetWidth );

		// If the image dimensions are within 1px of the expected size, we consider it a match.
		return ( Math.abs( width - targetWidth ) <= 1 && Math.abs( height - targetHeight ) <= 1 );
	}

	constrainImageDimensions( fullWidth, fullHeight, targetWidth ) {
		const ratio = targetWidth / fullWidth;

		// Very small dimensions may result in 0, 1 should be the minimum.
		let width = Math.max( 1, round( fullWidth * ratio ) );
		let height = Math.max( 1, round( fullHeight * ratio ) );

		// Sometimes, due to rounding, we'll end up with a result like this: 465x700 in a 177x177 box is 117x176... a pixel short.
		if ( width === targetWidth - 1 ) {
			width = targetWidth; // Round it up
		}

		return {
			width: width,
			height: height,
		};
	}

	getAvailableSizes() {
		const sizes = get( this.props.image, [ 'media_details', 'sizes' ], {} );

		if ( ! sizes.full ) {
			return;
		}

		let showSizes = {
			'default': sizes.large || sizes.full,
			// Always show the thumbnail size.
			thumbnail: sizes.thumbnail,
		};
		const fullWidth = sizes.full.width;
		const fullHeight = sizes.full.height;

		for( name in sizes ) {
			const size = sizes[ name ];

			// Add custom sizes that do not match the ratio (they won't be in the srcset).
			if ( ! this.imageMatchesRatio( fullWidth, fullHeight, size.width, size.height ) ) {
				showSizes[ name ] = size;
			}
		}

		// Possibly a mismatch?
		if ( showSizes.hasOwnProperty( 'large' ) ) {
			delete showSizes['default'];
		}

		return showSizes;
	}

	render() {
		const { attributes, setAttributes, isLargeViewport, isSelected, className, maxWidth, noticeOperations, noticeUI, toggleSelection } = this.props;
		const { url, alt, caption, align, id, href, width, height, srcSet } = attributes;
		const sizesAttr = attributes.sizes;

		const controls = (
			<BlockControls>
				<BlockAlignmentToolbar
					value={ align }
					onChange={ this.updateAlignment }
				/>

				<Toolbar>
					<MediaUpload
						onSelect={ this.onSelectImage }
						type="image"
						value={ id }
						render={ ( { open } ) => (
							<IconButton
								className="components-toolbar__control"
								label={ __( 'Edit image' ) }
								icon="edit"
								onClick={ open }
							/>
						) }
					/>
					<UrlInputButton onChange={ this.onSetHref } url={ href } />
				</Toolbar>
			</BlockControls>
		);

		const availableSizes = this.getAvailableSizes();

		if ( ! url ) {
			return (
				<Fragment>
					{ controls }
					<MediaPlaceholder
						icon="format-image"
						labels={ {
							title: __( 'Image' ),
							name: __( 'an image' ),
						} }
						className={ className }
						onSelect={ this.onSelectImage }
						notices={ noticeUI }
						onError={ noticeOperations.createErrorNotice }
						accept="image/*"
						type="image"
					/>
				</Fragment>
			);
		}

		const classes = classnames( className, {
			'is-transient': 0 === url.indexOf( 'blob:' ),
			'is-resized': !! width || !! height,
			'is-focused': isSelected,
		} );

		const isResizable = [ 'wide', 'full' ].indexOf( align ) === -1 && isLargeViewport;

		const getInspectorControls = ( imageWidth, imageHeight ) => (
			<InspectorControls>
				<PanelBody title={ __( 'Image Settings' ) }>
					<TextareaControl
						label={ __( 'Textual Alternative' ) }
						value={ alt }
						onChange={ this.updateAlt }
						help={ __( 'Describe the purpose of the image. Leave empty if the image is not a key part of the content.' ) }
					/>
					{ ! isEmpty( availableSizes ) && (
						<SelectControl
							label={ __( 'Source Type' ) }
							value={ url }
							options={ map( availableSizes, ( size, name ) => ( {
								value: size.source_url,
								label: startCase( name ),
							} ) ) }
							onChange={ this.updateImageURL }
						/>
					) }
					<div className="core-blocks-image__dimensions">
						<p className="core-blocks-image__dimensions__row">
							{ __( 'Image Dimensions' ) }
						</p>
						<div className="core-blocks-image__dimensions__row">
							<TextControl
								type="number"
								className="core-blocks-image__dimensions__width"
								label={ __( 'Width' ) }
								value={ width !== undefined ? width : '' }
								placeholder={ imageWidth }
								onChange={ this.updateWidth }
							/>
							<TextControl
								type="number"
								className="core-blocks-image__dimensions__height"
								label={ __( 'Height' ) }
								value={ height !== undefined ? height : '' }
								placeholder={ imageHeight }
								onChange={ this.updateHeight }
							/>
						</div>
						<div className="core-blocks-image__dimensions__row">
							<ButtonGroup aria-label={ __( 'Image Size' ) }>
								{ [ 25, 50, 75, 100 ].map( ( scale ) => {
									const editorWidth = getEditorWidth();
									let renderWidth = imageWidth;
									let renderHeight = imageHeight;

									if ( imageWidth > editorWidth ) {
										const dimensions = this.constrainImageDimensions( imageWidth, imageHeight, editorWidth );
										renderWidth = dimensions.width;
										renderHeight = dimensions.height;
									}

									const scaledWidth = round( renderWidth * ( scale / 100 ) );
									const scaledHeight = round( renderHeight * ( scale / 100 ) );

									const isCurrent = width === scaledWidth && height === scaledHeight;

									return (
										<Button
											key={ scale }
											isSmall
											isPrimary={ isCurrent }
											aria-pressed={ isCurrent }
											onClick={ this.updateDimensions( scaledWidth, scaledHeight ) }
										>
											{ scale }%
										</Button>
									);
								} ) }
							</ButtonGroup>
							<Button
								isSmall
								onClick={ this.updateDimensions() }
							>
								{ __( 'Reset' ) }
							</Button>
						</div>
					</div>
				</PanelBody>
			</InspectorControls>
		);

		// Disable reason: Each block can be selected by clicking on it
		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<Fragment>
				{ controls }
				{ noticeUI }
				<figure className={ classes }>
					<ImageSize src={ url } dirtynessTrigger={ align }>
						{ ( sizes ) => {
							const {
								imageWidthWithinContainer,
								imageHeightWithinContainer,
								imageWidth,
								imageHeight,
							} = sizes;

							// Disable reason: Image itself is not meant to be
							// interactive, but should direct focus to block
							// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
							const img = <img
								src={ url }
								alt={ alt }
								srcSet={ srcSet }
								sizes={ sizesAttr }
								onClick={ this.onImageClick }
							/>;

							if ( ! isResizable || ! imageWidthWithinContainer ) {
								return (
									<div style={ { width, height } }>
										{ img }
									</div>
								);
							}

							const currentWidth = width || imageWidthWithinContainer;
							const currentHeight = height || imageHeightWithinContainer;

							const ratio = imageWidth / imageHeight;
							const minWidth = imageWidth < imageHeight ? MIN_SIZE : MIN_SIZE * ratio;
							const minHeight = imageHeight < imageWidth ? MIN_SIZE : MIN_SIZE / ratio;

							return (
								<Fragment>
									{ getInspectorControls( imageWidth, imageHeight ) }
									<ResizableBox
										size={
											width && height ? {
												width,
												height,
											} : undefined
										}
										minWidth={ minWidth }
										maxWidth={ maxWidth }
										minHeight={ minHeight }
										maxHeight={ maxWidth / ratio }
										lockAspectRatio
										handleClasses={ {
											topRight: 'wp-block-image__resize-handler-top-right',
											bottomRight: 'wp-block-image__resize-handler-bottom-right',
											topLeft: 'wp-block-image__resize-handler-top-left',
											bottomLeft: 'wp-block-image__resize-handler-bottom-left',
										} }
										enable={ { top: false, right: true, bottom: false, left: false, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true } }
										onResizeStart={ () => {
											toggleSelection( false );
										} }
										onResizeStop={ ( event, direction, elt, delta ) => {
											this.updateWidth( currentWidth + delta.width );
											this.updateHeight( currentHeight + delta.height );
											toggleSelection( true );
										} }
									>
										{ img }
									</ResizableBox>
								</Fragment>
							);
						} }
					</ImageSize>
					{ ( caption && caption.length > 0 ) || isSelected ? (
						<RichText
							tagName="figcaption"
							placeholder={ __( 'Write caption…' ) }
							value={ caption || [] }
							unstableOnFocus={ this.onFocusCaption }
							onChange={ ( value ) => setAttributes( { caption: value } ) }
							isSelected={ this.state.captionFocused }
							inlineToolbar
						/>
					) : null }
				</figure>
			</Fragment>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

export default compose( [
	withSelect( ( select, props ) => {
		const { getMedia } = select( 'core' );
		const { getEditorSettings } = select( 'core/editor' );
		const { id } = props.attributes;
		const { maxWidth } = getEditorSettings();

		return {
			image: id ? getMedia( id ) : null,
			maxWidth,
		};
	} ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
	withNotices,
] )( ImageEdit );
