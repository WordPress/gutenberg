/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	IconButton,
	PanelBody,
	RangeControl,
	ToggleControl,
	Toolbar,
	withNotices,
	SVG,
	Path,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { compose } from '@wordpress/compose';
import {
	BlockControls,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadCheck,
	AlignmentToolbar,
	PanelColorSettings,
	RichText,
	withColors,
	getColorClassName,
} from '@wordpress/editor';

const blockAttributes = {
	title: {
		type: 'string',
		source: 'html',
		selector: 'p',
	},
	url: {
		type: 'string',
	},
	contentAlign: {
		type: 'string',
		default: 'center',
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
};

export const name = 'core/cover';

const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];
const IMAGE_BACKGROUND_TYPE = 'image';
const VIDEO_BACKGROUND_TYPE = 'video';

export const settings = {
	title: __( 'Cover' ),

	description: __( 'Add an image or video with a text overlay — great for headers.' ),

	icon: <SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><Path d="M4 4h7V2H4c-1.1 0-2 .9-2 2v7h2V4zm6 9l-4 5h12l-3-4-2.03 2.71L10 13zm7-4.5c0-.83-.67-1.5-1.5-1.5S14 7.67 14 8.5s.67 1.5 1.5 1.5S17 9.33 17 8.5zM20 2h-7v2h7v7h2V4c0-1.1-.9-2-2-2zm0 18h-7v2h7c1.1 0 2-.9 2-2v-7h-2v7zM4 13H2v7c0 1.1.9 2 2 2h7v-2H4v-7z" /><Path d="M0 0h24v24H0z" fill="none" /></SVG>,

	category: 'common',

	attributes: blockAttributes,

	supports: {
		align: true,
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { content } ) => (
					createBlock( 'core/cover', { title: content } )
				),
			},
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
				blocks: [ 'core/heading' ],
				transform: ( { title } ) => (
					createBlock( 'core/heading', { content: title } )
				),
			},
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
		( { attributes, setAttributes, isSelected, className, noticeOperations, noticeUI, overlayColor, setOverlayColor } ) => {
			const {
				backgroundType,
				contentAlign,
				dimRatio,
				hasParallax,
				id,
				title,
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
			const setTitle = ( newTitle ) => setAttributes( { title: newTitle } );

			const style = {
				...(
					backgroundType === IMAGE_BACKGROUND_TYPE ?
						backgroundImageStyles( url ) :
						{}
				),
				backgroundColor: overlayColor.color,
			};

			const controls = (
				<Fragment>
					<BlockControls>
						{ !! url && (
							<Fragment>
								<AlignmentToolbar
									value={ contentAlign }
									onChange={ ( nextAlign ) => {
										setAttributes( { contentAlign: nextAlign } );
									} }
								/>
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
				const hasTitle = ! RichText.isEmpty( title );
				const icon = hasTitle ? undefined : 'format-image';
				const label = hasTitle ? (
					<RichText
						tagName="h2"
						value={ title }
						onChange={ setTitle }
						inlineToolbar
					/>
				) : __( 'Cover' );

				return (
					<Fragment>
						{ controls }
						<MediaPlaceholder
							icon={ icon }
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
				contentAlign !== 'center' && `has-${ contentAlign }-content`,
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
						{ ( ! RichText.isEmpty( title ) || isSelected ) && (
							<RichText
								tagName="p"
								className="wp-block-cover-text"
								placeholder={ __( 'Write title…' ) }
								value={ title }
								onChange={ setTitle }
								inlineToolbar
							/>
						) }
					</div>
				</Fragment>
			);
		}
	),

	save( { attributes } ) {
		const {
			backgroundType,
			contentAlign,
			customOverlayColor,
			dimRatio,
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

	deprecated: [ {
		attributes: {
			...blockAttributes,
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
