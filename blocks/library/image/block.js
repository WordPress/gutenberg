/**
 * External dependencies
 */
import classnames from 'classnames';
import ResizableBox from 're-resizable';
import {
	startCase,
	isEmpty,
	map,
	get,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, compose } from '@wordpress/element';
import { mediaUpload, createMediaFromFile, getBlobByURL, revokeBlobURL, viewPort } from '@wordpress/utils';
import {
	Placeholder,
	Dashicon,
	Toolbar,
	DropZone,
	FormFileUpload,
	withAPIData,
	withContext,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import Editable from '../../editable';
import MediaUploadButton from '../../media-upload-button';
import InspectorControls from '../../inspector-controls';
import TextControl from '../../inspector-controls/text-control';
import SelectControl from '../../inspector-controls/select-control';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import UrlInputButton from '../../url-input/button';
import ImageSize from './image-size';

/**
 * Module constants
 */
const MIN_SIZE = 20;

class ImageBlock extends Component {
	constructor() {
		super( ...arguments );
		this.updateAlt = this.updateAlt.bind( this );
		this.updateAlignment = this.updateAlignment.bind( this );
		this.onSelectImage = this.onSelectImage.bind( this );
		this.onSetHref = this.onSetHref.bind( this );
		this.updateImageURL = this.updateImageURL.bind( this );
	}

	componentDidMount() {
		const { attributes, setAttributes } = this.props;
		const { id, url = '' } = attributes;

		if ( ! id && url.indexOf( 'blob:' ) === 0 ) {
			getBlobByURL( url )
				.then( createMediaFromFile )
				.then( ( media ) => {
					setAttributes( {
						id: media.id,
						url: media.source_url,
					} );
				} );
		}
	}

	componentDidUpdate( prevProps ) {
		const { id: prevID, url: prevUrl = '' } = prevProps.attributes;
		const { id, url = '' } = this.props.attributes;

		if ( ! prevID && prevUrl.indexOf( 'blob:' ) === 0 && id && url.indexOf( 'blob:' ) === -1 ) {
			revokeBlobURL( url );
		}
	}

	onSelectImage( media ) {
		const attributes = { url: media.url, alt: media.alt, id: media.id };
		if ( media.caption ) {
			attributes.caption = [ media.caption ];
		}
		this.props.setAttributes( attributes );
	}

	onSetHref( value ) {
		this.props.setAttributes( { href: value } );
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
		this.props.setAttributes( { url } );
	}

	getAvailableSizes() {
		return get( this.props.image, [ 'data', 'media_details', 'sizes' ], {} );
	}

	render() {
		const { attributes, setAttributes, focus, setFocus, className, settings, toggleSelection } = this.props;
		const { url, alt, caption, align, id, href, width, height } = attributes;

		const availableSizes = this.getAvailableSizes();
		const figureStyle = width ? { width } : {};
		const isResizable = [ 'wide', 'full' ].indexOf( align ) === -1 && ( ! viewPort.isExtraSmall() );
		const uploadButtonProps = { isLarge: true };
		const uploadFromFiles = ( event ) => mediaUpload( event.target.files, setAttributes );
		const dropFiles = ( files ) => mediaUpload( files, setAttributes );

		const controls = (
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ this.updateAlignment }
					/>

					<Toolbar>
						<MediaUploadButton
							buttonProps={ {
								className: 'components-icon-button components-toolbar__control',
								'aria-label': __( 'Edit image' ),
							} }
							onSelect={ this.onSelectImage }
							type="image"
							value={ id }
						>
							<Dashicon icon="edit" />
						</MediaUploadButton>
						<UrlInputButton onChange={ this.onSetHref } url={ href } />
					</Toolbar>
				</BlockControls>
			)
		);

		if ( ! url ) {
			return [
				controls,
				<Placeholder
					key="placeholder"
					instructions={ __( 'Drag image here or insert from media library' ) }
					icon="format-image"
					label={ __( 'Image' ) }
					className={ className }>
					<DropZone
						onFilesDrop={ dropFiles }
					/>
					<FormFileUpload
						isLarge
						className="wp-block-image__upload-button"
						onChange={ uploadFromFiles }
						accept="image/*"
					>
						{ __( 'Upload' ) }
					</FormFileUpload>
					<MediaUploadButton
						buttonProps={ uploadButtonProps }
						onSelect={ this.onSelectImage }
						type="image"
					>
						{ __( 'Insert from Media Library' ) }
					</MediaUploadButton>
				</Placeholder>,
			];
		}

		const focusCaption = ( focusValue ) => setFocus( { editable: 'caption', ...focusValue } );
		const classes = classnames( className, {
			'is-transient': 0 === url.indexOf( 'blob:' ),
			'is-resized': !! width,
			'is-focused': !! focus,
		} );

		// Disable reason: Each block can be selected by clicking on it

		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return [
			controls,
			focus && (
				<InspectorControls key="inspector">
					<h2>{ __( 'Image Settings' ) }</h2>
					<TextControl label={ __( 'Textual Alternative' ) } value={ alt } onChange={ this.updateAlt } help={ __( 'Describe the purpose of the image. Leave empty if the image is not a key part of the content.' ) } />
					{ ! isEmpty( availableSizes ) && (
						<SelectControl
							label={ __( 'Size' ) }
							value={ url }
							options={ map( availableSizes, ( size, name ) => ( {
								value: size.source_url,
								label: startCase( name ),
							} ) ) }
							onChange={ this.updateImageURL }
						/>
					) }
				</InspectorControls>
			),
			<figure key="image" className={ classes } style={ figureStyle }>
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
						const img = <img src={ url } alt={ alt } onClick={ setFocus } />;

						if ( ! isResizable || ! imageWidthWithinContainer ) {
							return img;
						}

						const currentWidth = width || imageWidthWithinContainer;
						const currentHeight = height || imageHeightWithinContainer;

						const ratio = imageWidth / imageHeight;
						const minWidth = imageWidth < imageHeight ? MIN_SIZE : MIN_SIZE * ratio;
						const minHeight = imageHeight < imageWidth ? MIN_SIZE : MIN_SIZE / ratio;

						return (
							<ResizableBox
								size={ {
									width: currentWidth,
									height: currentHeight,
								} }
								minWidth={ minWidth }
								maxWidth={ settings.maxWidth }
								minHeight={ minHeight }
								maxHeight={ settings.maxWidth / ratio }
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
						);
					} }
				</ImageSize>
				{ ( caption && caption.length > 0 ) || !! focus ? (
					<Editable
						tagName="figcaption"
						placeholder={ __( 'Write caption…' ) }
						value={ caption }
						focus={ focus && focus.editable === 'caption' ? focus : undefined }
						onFocus={ focusCaption }
						onChange={ ( value ) => setAttributes( { caption: value } ) }
						inlineToolbar
					/>
				) : null }
			</figure>,
		];
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

export default compose( [
	withContext( 'editor' )( ( settings ) => {
		return { settings };
	} ),
	withAPIData( ( props ) => {
		const { id } = props.attributes;
		if ( ! id ) {
			return {};
		}

		return {
			image: `/wp/v2/media/${ id }`,
		};
	} ),
] )( ImageBlock );
