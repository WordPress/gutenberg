/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { IconButton, PanelBody, RangeControl, ToggleControl, Toolbar } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import {
	createBlock,
	BlockControls,
	InspectorControls,
	BlockAlignmentToolbar,
	ImagePlaceholder,
	MediaUpload,
	AlignmentToolbar,
	RichText,
	InnerBlocks,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';

const validAlignments = [ 'left', 'center', 'right', 'wide', 'full' ];

const blockAttributes = {
	url: {
		type: 'string',
	},
	align: {
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
};

export const name = 'core/cover-image';

export const settings = {
	title: __( 'Cover Image' ),

	description: __( 'Cover Image is a bold image block with an optional title.' ),

	icon: 'cover-image',

	category: 'common',

	attributes: blockAttributes,

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { content } ) => (
					createBlock( 'core/cover-image', { title: content } )
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
		],
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( -1 !== validAlignments.indexOf( align ) ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, className } ) {
		const { align, url, id, hasParallax, dimRatio } = attributes;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
		const onSelectImage = ( media ) => setAttributes( { url: media.url, id: media.id } );
		const toggleParallax = () => setAttributes( { hasParallax: ! hasParallax } );
		const setDimRatio = ( ratio ) => setAttributes( { dimRatio: ratio } );

		const style = backgroundImageStyles( url );
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
				<BlockControls>
					<BlockAlignmentToolbar
						value={ align }
						onChange={ updateAlignment }
					/>
					<AlignmentToolbar
						value={ contentAlign }
						onChange={ ( nextAlign ) => {
							setAttributes( { contentAlign: nextAlign } );
						} }
					/>
					<Toolbar>
						<MediaUpload
							onSelect={ onSelectImage }
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
					</Toolbar>
				</BlockControls>
				{ !! url && (
					<InspectorControls>
						<PanelBody title={ __( 'Cover Image Settings' ) }>
							<ToggleControl
								label={ __( 'Fixed Background' ) }
								checked={ !! hasParallax }
								onChange={ toggleParallax }
							/>
							<RangeControl
								label={ __( 'Background Dimness' ) }
								value={ dimRatio }
								onChange={ setDimRatio }
								min={ 0 }
								max={ 100 }
								step={ 10 }
							/>
						</PanelBody>
					</InspectorControls>
				) }
			</Fragment>
		);

		if ( ! url ) {
			const icon = 'format-image';
			const label = __( 'Cover Image' );

			return (
				<Fragment>
					{ controls }
					<ImagePlaceholder
						{ ...{ className, icon, label, onSelectImage } }
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
							template={ [
								[ 'core/paragraph', {
									align: 'center',
									fontSize: 'large',
									placeholder: __( 'Write title…' ),
									textColor: '#fff',
								} ],
							] }
							allowedBlocks={ [ 'core/button', 'core/heading', 'core/paragraph', 'core/subhead' ] }
						/>
					</div>
				</div>
			</Fragment>
		);
	},

	save( { attributes, className } ) {
		const { url, hasParallax, dimRatio, align } = attributes;
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
		undefined;
}
