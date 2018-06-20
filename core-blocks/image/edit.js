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

		if ( ! this.props.isSelected && prevProps.isSelected && this.state.captionFocused ) {
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
		this.props.setAttributes( {
			...pick( media, [ 'alt', 'id', 'caption', 'url' ] ),
			width: undefined,
			height: undefined,
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
	}

	updateWidth( width ) {
		this.props.setAttributes( { width: parseInt( width, 10 ) } );
	}

	updateHeight( height ) {
		this.props.setAttributes( { height: parseInt( height, 10 ) } );
	}

	updateDimensions( width = undefined, height = undefined ) {
		return () => {
			this.props.setAttributes( { width, height } );
		};
	}

	getAvailableSizes() {
		return get( this.props.image, [ 'media_details', 'sizes' ], {} );
	}

	render() {
		const { attributes, setAttributes, isLargeViewport, isSelected, className, maxWidth, toggleSelection } = this.props;
		const { url, alt, caption, align, id, href, width, height } = attributes;

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
									const scaledWidth = Math.round( imageWidth * ( scale / 100 ) );
									const scaledHeight = Math.round( imageHeight * ( scale / 100 ) );

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
							const img = <img src={ url } alt={ alt } onClick={ this.onImageClick } />;

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
											setAttributes( {
												width: parseInt( currentWidth + delta.width, 10 ),
												height: parseInt( currentHeight + delta.height, 10 ),
											} );
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
] )( ImageEdit );
