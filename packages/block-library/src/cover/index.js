/**
 * External dependencies
 */
import { omit } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import {
	FocalPointPicker,
	IconButton,
	PanelBody,
	RangeControl,
	ToggleControl,
	Toolbar,
	withNotices,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';
import {
	BlockControls,
	BlockIcon,
	InnerBlocks,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadCheck,
	PanelColorSettings,
	RichText,
	getColorClassName,
	withColors,
} from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import icon from './icon';

const blockAttributes = {
	url: {
		type: 'string',
	},
	id: {
		type: 'number',
	},
	hasParallax: {
		type: 'boolean',
		default: false,
	},
	dimRatio: {
		type: 'number',
		default: 50,
	},
	overlayColor: {
		type: 'string',
	},
	customOverlayColor: {
		type: 'string',
	},
	backgroundType: {
		type: 'string',
		default: 'image',
	},
	focalPoint: {
		type: 'object',
	},
};

export const name = 'core/cover';

const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];
const IMAGE_BACKGROUND_TYPE = 'image';
const VIDEO_BACKGROUND_TYPE = 'video';
const INNER_BLOCKS_TEMPLATE = [
	[ 'core/paragraph', {
		align: 'center',
		fontSize: 'large',
		placeholder: __( 'Write title…' ),
	} ],
];
const INNER_BLOCKS_ALLOWED_BLOCKS = [ 'core/button', 'core/heading', 'core/paragraph' ];

export const settings = {
	title: __( 'Cover' ),

	description: __( 'Add an image or video with a text overlay — great for headers.' ),

	icon,

	category: 'common',

	attributes: blockAttributes,

	supports: {
		align: true,
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/image' ],
				transform: ( { caption, url, align, id } ) => (
					createBlock( 'core/cover', {
						title: caption,
						url,
						align,
						id,
					} )
				),
			},
			{
				type: 'block',
				blocks: [ 'core/video' ],
				transform: ( { caption, src, align, id } ) => (
					createBlock( 'core/cover', {
						title: caption,
						url: src,
						align,
						id,
						backgroundType: VIDEO_BACKGROUND_TYPE,
					} )
				),
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/image' ],
				isMatch: ( { backgroundType, url } ) => {
					return ! url || backgroundType === IMAGE_BACKGROUND_TYPE;
				},
				transform: ( { title, url, align, id } ) => (
					createBlock( 'core/image', {
						caption: title,
						url,
						align,
						id,
					} )
				),
			},
			{
				type: 'block',
				blocks: [ 'core/video' ],
				isMatch: ( { backgroundType, url } ) => {
					return ! url || backgroundType === VIDEO_BACKGROUND_TYPE;
				},
				transform: ( { title, url, align, id } ) => (
					createBlock( 'core/video', {
						caption: title,
						src: url,
						id,
						align,
					} )
				),
			},
		],
	},

	edit: compose( [
		withColors( { overlayColor: 'background-color' } ),
		withNotices,
	] )(
		( { attributes, setAttributes, className, noticeOperations, noticeUI, overlayColor, setOverlayColor } ) => {
			const {
				backgroundType,
				dimRatio,
				focalPoint,
				hasParallax,
				id,
				url,
			} = attributes;
			const onSelectMedia = ( media ) => {
				if ( ! media || ! media.url ) {
					setAttributes( { url: undefined, id: undefined } );
					return;
				}
				let mediaType;
				// for media selections originated from a file upload.
				if ( media.media_type ) {
					if ( media.media_type === IMAGE_BACKGROUND_TYPE ) {
						mediaType = IMAGE_BACKGROUND_TYPE;
					} else {
						// only images and videos are accepted so if the media_type is not an image we can assume it is a video.
						// Videos contain the media type of 'file' in the object returned from the rest api.
						mediaType = VIDEO_BACKGROUND_TYPE;
					}
				} else { // for media selections originated from existing files in the media library.
					if (
						media.type !== IMAGE_BACKGROUND_TYPE &&
						media.type !== VIDEO_BACKGROUND_TYPE
					) {
						return;
					}
					mediaType = media.type;
				}

				setAttributes( {
					url: media.url,
					id: media.id,
					backgroundType: mediaType,
				} );
			};
			const toggleParallax = () => setAttributes( { hasParallax: ! hasParallax } );
			const setDimRatio = ( ratio ) => setAttributes( { dimRatio: ratio } );

			const style = {
				...(
					backgroundType === IMAGE_BACKGROUND_TYPE ?
						backgroundImageStyles( url ) :
						{}
				),
				backgroundColor: overlayColor.color,
			};

			if ( focalPoint ) {
				style.backgroundPosition = `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`;
			}

			const controls = (
				<Fragment>
					<BlockControls>
						{ !! url && (
							<Fragment>
								<MediaUploadCheck>
									<Toolbar>
										<MediaUpload
											onSelect={ onSelectMedia }
											allowedTypes={ ALLOWED_MEDIA_TYPES }
											value={ id }
											render={ ( { open } ) => (
												<IconButton
													className="components-toolbar__control"
													label={ __( 'Edit media' ) }
													icon="edit"
													onClick={ open }
												/>
											) }
										/>
									</Toolbar>
								</MediaUploadCheck>
							</Fragment>
						) }
					</BlockControls>
					{ !! url && (
						<InspectorControls>
							<PanelBody title={ __( 'Cover Settings' ) }>
								{ IMAGE_BACKGROUND_TYPE === backgroundType && (
									<ToggleControl
										label={ __( 'Fixed Background' ) }
										checked={ hasParallax }
										onChange={ toggleParallax }
									/>
								) }
								{ IMAGE_BACKGROUND_TYPE === backgroundType && ! hasParallax && (
									<FocalPointPicker
										label={ __( 'Focal Point Picker' ) }
										url={ url }
										value={ focalPoint }
										onChange={ ( value ) => setAttributes( { focalPoint: value } ) }
									/>
								) }
								<PanelColorSettings
									title={ __( 'Overlay' ) }
									initialOpen={ true }
									colorSettings={ [ {
										value: overlayColor.color,
										onChange: setOverlayColor,
										label: __( 'Overlay Color' ),
									} ] }
								>
									<RangeControl
										label={ __( 'Background Opacity' ) }
										value={ dimRatio }
										onChange={ setDimRatio }
										min={ 0 }
										max={ 100 }
										step={ 10 }
									/>
								</PanelColorSettings>
							</PanelBody>
						</InspectorControls>
					) }
				</Fragment>
			);

			if ( ! url ) {
				const placeholderIcon = <BlockIcon icon={ icon } />;
				const label = __( 'Cover' );

				return (
					<Fragment>
						{ controls }
						<MediaPlaceholder
							icon={ placeholderIcon }
							className={ className }
							labels={ {
								title: label,
								instructions: __( 'Drag an image or a video, upload a new one or select a file from your library.' ),
							} }
							onSelect={ onSelectMedia }
							accept="image/*,video/*"
							allowedTypes={ ALLOWED_MEDIA_TYPES }
							notices={ noticeUI }
							onError={ noticeOperations.createErrorNotice }
						/>
					</Fragment>
				);
			}

			const classes = classnames(
				className,
				dimRatioToClass( dimRatio ),
				{
					'has-background-dim': dimRatio !== 0,
					'has-parallax': hasParallax,
				}
			);

			return (
				<Fragment>
					{ controls }
					<div
						data-url={ url }
						style={ style }
						className={ classes }
					>
						{ VIDEO_BACKGROUND_TYPE === backgroundType && (
							<video
								className="wp-block-cover__video-background"
								autoPlay
								muted
								loop
								src={ url }
							/>
						) }
						<div className="wp-block-cover__inner-container">
							<InnerBlocks
								template={ INNER_BLOCKS_TEMPLATE }
								allowedBlocks={ INNER_BLOCKS_ALLOWED_BLOCKS }
							/>
						</div>
					</div>
				</Fragment>
			);
		}
	),

	save( { attributes } ) {
		const {
			backgroundType,
			customOverlayColor,
			dimRatio,
			focalPoint,
			hasParallax,
			overlayColor,
			url,
		} = attributes;
		const overlayColorClass = getColorClassName( 'background-color', overlayColor );
		const style = backgroundType === IMAGE_BACKGROUND_TYPE ?
			backgroundImageStyles( url ) :
			{};
		if ( ! overlayColorClass ) {
			style.backgroundColor = customOverlayColor;
		}
		if ( focalPoint && ! hasParallax ) {
			style.backgroundPosition = `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`;
		}

		const classes = classnames(
			dimRatioToClass( dimRatio ),
			overlayColorClass,
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			},
		);

		return (
			<div className={ classes } style={ style }>
				{ VIDEO_BACKGROUND_TYPE === backgroundType && url && ( <video
					className="wp-block-cover__video-background"
					autoPlay
					muted
					loop
					src={ url }
				/> ) }
				<div className="wp-block-cover__inner-container">
					<InnerBlocks.Content />
				</div>
			</div>
		);
	},

	deprecated: [ {
		attributes: {
			...blockAttributes,
			title: {
				type: 'string',
				source: 'html',
				selector: 'p',
			},
			contentAlign: {
				type: 'string',
				default: 'center',
			},
		},

		supports: {
			align: true,
		},

		save( { attributes } ) {
			const {
				backgroundType,
				contentAlign,
				customOverlayColor,
				dimRatio,
				focalPoint,
				hasParallax,
				overlayColor,
				title,
				url,
			} = attributes;
			const overlayColorClass = getColorClassName( 'background-color', overlayColor );
			const style = backgroundType === IMAGE_BACKGROUND_TYPE ?
				backgroundImageStyles( url ) :
				{};
			if ( ! overlayColorClass ) {
				style.backgroundColor = customOverlayColor;
			}
			if ( focalPoint && ! hasParallax ) {
				style.backgroundPosition = `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`;
			}

			const classes = classnames(
				dimRatioToClass( dimRatio ),
				overlayColorClass,
				{
					'has-background-dim': dimRatio !== 0,
					'has-parallax': hasParallax,
					[ `has-${ contentAlign }-content` ]: contentAlign !== 'center',
				},
			);

			return (
				<div className={ classes } style={ style }>
					{ VIDEO_BACKGROUND_TYPE === backgroundType && url && ( <video
						className="wp-block-cover__video-background"
						autoPlay
						muted
						loop
						src={ url }
					/> ) }
					{ ! RichText.isEmpty( title ) && (
						<RichText.Content tagName="p" className="wp-block-cover-text" value={ title } />
					) }
				</div>
			);
		},

		migrate( attributes ) {
			return [
				omit( attributes, [ 'title', 'contentAlign' ] ),
				[
					createBlock(
						'core/paragraph',
						{
							content: attributes.title,
							align: attributes.contentAlign,
							fontSize: 'large',
							placeholder: __( 'Write title…' ),
						}
					),
				],
			];
		},
	}, {
		attributes: {
			...blockAttributes,
			title: {
				type: 'string',
				source: 'html',
				selector: 'p',
			},
			contentAlign: {
				type: 'string',
				default: 'center',
			},
			align: {
				type: 'string',
			},
		},

		supports: {
			className: false,
		},

		save( { attributes } ) {
			const { url, title, hasParallax, dimRatio, align, contentAlign, overlayColor, customOverlayColor } = attributes;
			const overlayColorClass = getColorClassName( 'background-color', overlayColor );
			const style = backgroundImageStyles( url );
			if ( ! overlayColorClass ) {
				style.backgroundColor = customOverlayColor;
			}

			const classes = classnames(
				'wp-block-cover-image',
				dimRatioToClass( dimRatio ),
				overlayColorClass,
				{
					'has-background-dim': dimRatio !== 0,
					'has-parallax': hasParallax,
					[ `has-${ contentAlign }-content` ]: contentAlign !== 'center',
				},
				align ? `align${ align }` : null,
			);

			return (
				<div className={ classes } style={ style }>
					{ ! RichText.isEmpty( title ) && (
						<RichText.Content tagName="p" className="wp-block-cover-image-text" value={ title } />
					) }
				</div>
			);
		},
	}, {
		attributes: {
			...blockAttributes,
			align: {
				type: 'string',
			},
			title: {
				type: 'string',
				source: 'html',
				selector: 'h2',
			},
			contentAlign: {
				type: 'string',
				default: 'center',
			},
		},

		save( { attributes } ) {
			const { url, title, hasParallax, dimRatio, align } = attributes;
			const style = backgroundImageStyles( url );
			const classes = classnames(
				dimRatioToClass( dimRatio ),
				{
					'has-background-dim': dimRatio !== 0,
					'has-parallax': hasParallax,
				},
				align ? `align${ align }` : null,
			);

			return (
				<section className={ classes } style={ style }>
					<RichText.Content tagName="h2" value={ title } />
				</section>
			);
		},
	} ],
};

function dimRatioToClass( ratio ) {
	return ( ratio === 0 || ratio === 50 ) ?
		null :
		'has-background-dim-' + ( 10 * Math.round( ratio / 10 ) );
}

function backgroundImageStyles( url ) {
	return url ?
		{ backgroundImage: `url(${ url })` } :
		{};
}
