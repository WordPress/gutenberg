/**
 * External dependencies
 */
import { omit } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { IconButton, PanelBody, RangeControl, ToggleControl, Toolbar, withNotices } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { compose } from '@wordpress/compose';
import {
	BlockControls,
	InspectorControls,
	InnerBlocks,
	BlockAlignmentToolbar,
	MediaPlaceholder,
	MediaUpload,
	PanelColorSettings,
	RichText,
	withColors,
	getColorClassName,
} from '@wordpress/editor';

const validAlignments = [ 'left', 'center', 'right', 'wide', 'full' ];

const blockAttributes = {
	title: {
		source: 'html',
		selector: 'p',
	},
	url: {
		type: 'string',
	},
	align: {
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
};

export const name = 'core/cover-image';

const INNER_BLOCKS_TEMPLATE = [
	[ 'core/paragraph', {
		align: 'center',
		fontSize: 'large',
		placeholder: __( 'Write title…' ),
	} ],
];
const INNER_BLOCKS_ALLOWED_BLOCKS = [ 'core/button', 'core/heading', 'core/paragraph' ];
const ALLOWED_MEDIA_TYPES = [ 'image' ];

export const settings = {
	title: __( 'Cover Image' ),

	description: __( 'Add a full-width image, and layer text over it — great for headers.' ),

	icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4h7V2H4c-1.1 0-2 .9-2 2v7h2V4zm6 9l-4 5h12l-3-4-2.03 2.71L10 13zm7-4.5c0-.83-.67-1.5-1.5-1.5S14 7.67 14 8.5s.67 1.5 1.5 1.5S17 9.33 17 8.5zM20 2h-7v2h7v7h2V4c0-1.1-.9-2-2-2zm0 18h-7v2h7c1.1 0 2-.9 2-2v-7h-2v7zM4 13H2v7c0 1.1.9 2 2 2h7v-2H4v-7z" /><path d="M0 0h24v24H0z" fill="none" /></svg>,

	category: 'common',

	attributes: blockAttributes,

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/image' ],
				transform: ( { caption, url, align, id } ) => (
					createBlock( 'core/cover-image', {
						title: caption,
						url,
						align,
						id,
					} )
				),
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/image' ],
				transform: ( { title, url, align, id } ) => (
					createBlock( 'core/image', {
						caption: title,
						url,
						align,
						id,
					} )
				),
			},
		],
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( -1 !== validAlignments.indexOf( align ) ) {
			return { 'data-align': align };
		}
	},

	edit: compose( [
		withColors( { overlayColor: 'background-color' } ),
		withNotices,
	] )(
		( { attributes, setAttributes, className, noticeOperations, noticeUI, overlayColor, setOverlayColor } ) => {
			const { url, align, id, hasParallax, dimRatio } = attributes;
			const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
			const onSelectImage = ( media ) => {
				if ( ! media || ! media.url ) {
					setAttributes( { url: undefined, id: undefined } );
					return;
				}
				setAttributes( { url: media.url, id: media.id } );
			};
			const toggleParallax = () => setAttributes( { hasParallax: ! hasParallax } );
			const setDimRatio = ( ratio ) => setAttributes( { dimRatio: ratio } );

			const style = {
				...backgroundImageStyles( url ),
				backgroundColor: overlayColor.color,
			};

			const classes = classnames(
				className,
				dimRatioToClass( dimRatio ),
				{
					'has-background-dim': dimRatio !== 0,
					'has-parallax': hasParallax,
				}
			);

			const controls = (
				<Fragment>
					{ !! url && (
						<BlockControls>
							<BlockAlignmentToolbar
								value={ align }
								onChange={ updateAlignment }
							/>
							<Toolbar>
								<MediaUpload
									onSelect={ onSelectImage }
									allowedTypes={ ALLOWED_MEDIA_TYPES }
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
							</Toolbar>
						</BlockControls>
					) }
					{ !! url && (
						<InspectorControls>
							<PanelBody title={ __( 'Cover Image Settings' ) }>
								<ToggleControl
									label={ __( 'Fixed Background' ) }
									checked={ hasParallax }
									onChange={ toggleParallax }
								/>
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
				const icon = 'format-image';
				const label = ( 'Cover Image' );

				return (
					<Fragment>
						{ controls }
						<MediaPlaceholder
							icon={ icon }
							className={ className }
							labels={ {
								title: label,
								name: __( 'an image' ),
							} }
							onSelect={ onSelectImage }
							accept="image/*"
							allowedTypes={ ALLOWED_MEDIA_TYPES }
							notices={ noticeUI }
							onError={ noticeOperations.createErrorNotice }
						/>
					</Fragment>
				);
			}

			return (
				<Fragment>
					{ controls }
					<div
						data-url={ url }
						style={ style }
						className={ classes }
					>
						<div className="wp-block-cover-image__inner-container">
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

	save( { attributes, className } ) {
		const { url, hasParallax, dimRatio, align, overlayColor, customOverlayColor } = attributes;
		const overlayColorClass = getColorClassName( 'background-color', overlayColor );
		const style = backgroundImageStyles( url );
		if ( ! overlayColorClass ) {
			style.backgroundColor = customOverlayColor;
		}

		const classes = classnames(
			className,
			dimRatioToClass( dimRatio ),
			overlayColorClass,
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			},
			align ? `align${ align }` : null,
		);

		return (
			<div className={ classes } style={ style }>
				<div className="wp-block-cover-image__inner-container">
					<InnerBlocks.Content />
				</div>
			</div>
		);
	},

	deprecated: [ {
		attributes: {
			...blockAttributes,
			title: {
				type: 'array',
				source: 'children',
				selector: 'p',
			},
			contentAlign: {
				type: 'string',
				default: 'center',
			},
		},

		save( { attributes, className } ) {
			const { url, title, hasParallax, dimRatio, align, contentAlign } = attributes;
			const style = backgroundImageStyles( url );
			const classes = classnames(
				className,
				dimRatioToClass( dimRatio ),
				{
					'has-background-dim': dimRatio !== 0,
					'has-parallax': hasParallax,
					[ `has-${ contentAlign }-content` ]: contentAlign !== 'center',
				},
				align ? `align${ align }` : null,
			);

			return (
				<div className={ classes } style={ style }>
					{ title && title.length > 0 && (
						<RichText.Content tagName="p" className="wp-block-cover-image-text" value={ title } />
					) }
				</div>
			);
		},

		migrate( attributes ) {
			return [
				omit( attributes, [ 'title', 'contentAlign' ] ),
				[ createBlock( 'core/paragraph', {
					content: attributes.title,
					align: attributes.contentAlign,
					fontSize: 'large',
					placeholder: __( 'Write title…' ),
				} ) ],
			];
		},
	}, {
		attributes: {
			...blockAttributes,
			title: {
				type: 'array',
				source: 'children',
				selector: 'h2',
			},
		},

		save( { attributes, className } ) {
			const { url, title, hasParallax, dimRatio, align } = attributes;
			const style = backgroundImageStyles( url );
			const classes = classnames(
				className,
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
