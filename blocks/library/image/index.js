/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query } from '../../api';
import ImageBlockForm from './form';

const { attr, children } = query;

/**
 * Returns an attribute setter with behavior that if the target value is
 * already the assigned attribute value, it will be set to undefined.
 *
 * @param  {string}   align Alignment value
 * @return {Function}       Attribute setter
 */
function toggleAlignment( align ) {
	return ( attributes, setAttributes ) => {
		const nextAlign = attributes.align === align ? undefined : align;
		setAttributes( { align: nextAlign } );
	};
}

registerBlockType( 'core/image', {
	title: __( 'Image' ),

	icon: 'format-image',

	category: 'common',

	attributes: {
		url: attr( 'img', 'src' ),
		alt: attr( 'img', 'alt' ),
		caption: children( 'figcaption' ),
	},

	controls: [
		{
			icon: 'align-left',
			title: __( 'Align left' ),
			isActive: ( { align } ) => 'left' === align,
			onClick: toggleAlignment( 'left' ),
		},
		{
			icon: 'align-center',
			title: __( 'Align center' ),
			isActive: ( { align } ) => ! align || 'center' === align,
			onClick: toggleAlignment( 'center' ),
		},
		{
			icon: 'align-right',
			title: __( 'Align right' ),
			isActive: ( { align } ) => 'right' === align,
			onClick: toggleAlignment( 'right' ),
		},
		{
			icon: 'align-wide',
			title: __( 'Wide width' ),
			isActive: ( { align } ) => 'wide' === align,
			onClick: toggleAlignment( 'wide' ),
		},
		{
			icon: 'align-full-width',
			title: __( 'Full width' ),
			isActive: ( { align } ) => 'full' === align,
			onClick: toggleAlignment( 'full' ),
		},
	],

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit: ImageBlockForm,

	save( { attributes } ) {
		const { url, alt, caption, align = 'none' } = attributes;
		const img = <img src={ url } alt={ alt } className={ `align${ align }` } />;

		if ( ! caption || ! caption.length ) {
			return img;
		}

		return (
			<figure>
				{ img }
				<figcaption>{ caption }</figcaption>
			</figure>
		);
	},
} );
