/**
 * External dependencies
 */
import classnames from 'classnames';
import ResizableBox from 'react-resizable-box';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Placeholder, Dashicon, Toolbar, DropZone, FormFileUpload } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './block.scss';
import './style.scss';
import { registerBlockType, source } from '../../api';
import withEditorSettings from '../../with-editor-settings';
import Editable from '../../editable';
import MediaUploadButton from '../../media-upload-button';
import InspectorControls from '../../inspector-controls';
import TextControl from '../../inspector-controls/text-control';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import BlockDescription from '../../block-description';
import UrlInputButton from '../../url-input/button';
import ImageSize from './image-size';

const { attr, children } = source;

registerBlockType( 'core/image', {
	title: __( 'Image' ),

	icon: 'format-image',

	category: 'common',

	keywords: [ __( 'photo' ) ],

	attributes: {
		url: {
			type: 'string',
			source: attr( 'img', 'src' ),
		},
		alt: {
			type: 'string',
			source: attr( 'img', 'alt' ),
		},
		caption: {
			type: 'array',
			source: children( 'figcaption' ),
		},
		href: {
			type: 'string',
			source: attr( 'a', 'href' ),
		},
		id: {
			type: 'number',
		},
		align: {
			type: 'string',
		},
		width: {
			type: 'number',
		},
		height: {
			type: 'number',
		},
	},

	transforms: {
		from: [
			{
				type: 'raw',
				source: ( node ) => (
					node.nodeName === 'IMG' ||
					( ! node.textContent && node.querySelector( 'img' ) )
				),
				attributes: {
					url: attr( 'img', 'src' ),
					alt: attr( 'img', 'alt' ),
					caption: children( 'figcaption' ),
				},
			},
		],
	},

	getEditWrapperProps( attributes ) {
		const { align, width } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align, 'data-resized': !! width };
		}
	},

	edit: withEditorSettings()( ( { attributes, setAttributes, focus, setFocus, className, settings } ) => {
		const { url, alt, caption, align, id, href, width, height } = attributes;
		const updateAlt = ( newAlt ) => setAttributes( { alt: newAlt } );
		const updateAlignment = ( nextAlign ) => {
			const extraUpdatedAttributes = [ 'wide', 'full' ].indexOf( nextAlign ) !== -1
				? { width: undefined, height: undefined }
				: {};
			setAttributes( { ...extraUpdatedAttributes, align: nextAlign } );
		};
		const onSelectImage = ( media ) => {
			setAttributes( { url: media.url, alt: media.alt, caption: media.caption, id: media.id } );
		};
		const isResizable = [ 'wide', 'full' ].indexOf( align ) === -1;
		const uploadButtonProps = { isLarge: true };
		const onSetHref = ( value ) => setAttributes( { href: value } );
		const uploadFromFiles = ( files ) => {
			const media = files[ 0 ];

			// Only allow image uploads
			if ( ! /^image\//.test( media.type ) ) {
				return;
			}

			// Use File API to assign temporary URL from upload
			setAttributes( {
				url: window.URL.createObjectURL( media ),
			} );

			// Create upload payload
			const data = new window.FormData();
			data.append( 'file', media );

			new wp.api.models.Media().save( null, {
				data: data,
				contentType: false,
			} ).done( ( savedMedia ) => {
				setAttributes( {
					id: savedMedia.id,
					url: savedMedia.source_url,
				} );
			} ).fail( () => {
				// Reset to empty on failure.
				// TODO: Better failure messaging
				setAttributes( { url: null } );
			} );
		};

		const controls = (
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ updateAlignment }
					/>

					<Toolbar>
						<li>
							<MediaUploadButton
								buttonProps={ {
									className: 'components-icon-button components-toolbar__control',
									'aria-label': __( 'Edit image' ),
								} }
								onSelect={ onSelectImage }
								type="image"
								value={ id }
							>
								<Dashicon icon="edit" />
							</MediaUploadButton>
						</li>
						<UrlInputButton onChange={ onSetHref } url={ href } />
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
						onFilesDrop={ uploadFromFiles }
					/>
					<FormFileUpload
						isLarge
						className="wp-block-image__upload-button"
						onChange={ ( event ) => uploadFromFiles( event.target.files ) }
						accept="image/*"
					>
						{ __( 'Upload' ) }
					</FormFileUpload>
					<MediaUploadButton
						buttonProps={ uploadButtonProps }
						onSelect={ onSelectImage }
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
					<BlockDescription>
						<p>{ __( 'Worth a thousand words.' ) }</p>
					</BlockDescription>
					<h3>{ __( 'Image Settings' ) }</h3>
					<TextControl label={ __( 'Alternate Text' ) } value={ alt } onChange={ updateAlt } />
				</InspectorControls>
			),
			<figure key="image" className={ classes }>
				<ImageSize src={ url } dirtynessTrigger={ align }>
					{ ( sizes ) => {
						const {
							imageWidthWithinContainer,
							imageHeightWithinContainer,
							imageWidth,
							imageHeight,
						} = sizes;
						const currentWidth = width || imageWidthWithinContainer;
						const currentHeight = height || imageHeightWithinContainer;
						const img = <img src={ url } alt={ alt } onClick={ setFocus } />;
						if ( ! isResizable || ! imageWidthWithinContainer ) {
							return img;
						}
						const ratio = imageWidth / imageHeight;
						const minWidth = imageWidth < imageHeight ? 10 : 10 * ratio;
						const minHeight = imageHeight < imageWidth ? 10 : 10 / ratio;
						return (
							<ResizableBox
								width={ currentWidth }
								height={ currentHeight }
								minWidth={ minWidth }
								maxWidth={ settings.maxWidth }
								minHeight={ minHeight }
								maxHeight={ settings.maxWidth / ratio }
								lockAspectRatio
								handlerClasses={ {
									topRight: 'wp-block-image__resize-handler-top-right',
									bottomRight: 'wp-block-image__resize-handler-bottom-right',
									topLeft: 'wp-block-image__resize-handler-top-left',
									bottomLeft: 'wp-block-image__resize-handler-bottom-left',
								} }
								enable={ { top: false, right: true, bottom: false, left: false, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true } }
								onResize={ ( event, direction, elt ) => {
									setAttributes( {
										width: elt.clientWidth,
										height: elt.clientHeight,
									} );
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
	} ),

	save( { attributes } ) {
		const { url, alt, caption, align, href, width, height } = attributes;
		const extraImageProps = width || height ? { width, height } : {};
		const image = <img src={ url } alt={ alt } { ...extraImageProps } />;

		return (
			<figure className={ align && `align${ align }` }>
				{ href ? <a href={ href }>{ image }</a> : image }
				{ caption && caption.length > 0 && <figcaption>{ caption }</figcaption> }
			</figure>
		);
	},
} );
