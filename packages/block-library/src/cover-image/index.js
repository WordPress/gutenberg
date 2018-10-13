/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import {
	getColorClassName,
	RichText,
} from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

const validAlignments = [ 'left', 'center', 'right', 'wide', 'full' ];

const blockAttributes = {
	align: {
		type: 'string',
	},
	contentAlign: {
		type: 'string',
		default: 'center',
	},
	customOverlayColor: {
		type: 'string',
	},
	dimRatio: {
		type: 'number',
		default: 50,
	},
	hasParallax: {
		type: 'boolean',
		default: false,
	},
	id: {
		type: 'number',
	},
	overlayColor: {
		type: 'string',
	},
	title: {
		source: 'html',
		selector: 'p',
	},
	url: {
		type: 'string',
	},
};

export const name = 'core/cover-image';

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
				blocks: [ 'core/heading' ],
				transform: ( { content } ) => (
					createBlock( 'core/cover-image', { title: content } )
				),
			},
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
				blocks: [ 'core/heading' ],
				transform: ( { title } ) => (
					createBlock( 'core/heading', { content: title } )
				),
			},
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
		if ( validAlignments.includes( align ) ) {
			return { 'data-align': align };
		}
	},

	edit,

	save( { attributes, className } ) {
		const { url, title, hasParallax, dimRatio, align, contentAlign, overlayColor, customOverlayColor } = attributes;
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

	deprecated: [ {
		attributes: {
			...blockAttributes,
			title: {
				source: 'html',
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

function backgroundImageStyles( url ) {
	return url ?
		{ backgroundImage: `url(${ url })` } :
		{};
}

function dimRatioToClass( ratio ) {
	return ( ratio === 0 || ratio === 50 ) ?
		null :
		'has-background-dim-' + ( 10 * Math.round( ratio / 10 ) );
}
