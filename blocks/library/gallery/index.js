/**
 * Internal dependencies
 */
import { __ } from 'i18n';
import './style.scss';
import { registerBlockType, query as hpq } from '../../api';

import GalleryImage from './gallery-image';
import GalleryBlockForm from './form';

const { query, attr } = hpq;

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

registerBlockType( 'core/gallery', {
	title: wp.i18n.__( 'Gallery' ),
	icon: 'format-gallery',
	category: 'common',

	attributes: {
		images:
			query( 'div.blocks-gallery figure.blocks-gallery-image img', {
				url: attr( 'src' ),
				alt: attr( 'alt' ),
			} ) || [],
	},

	controls: [
		{
			icon: 'align-left',
			title: wp.i18n.__( 'Align left' ),
			isActive: ( { align } ) => 'left' === align,
			onClick: toggleAlignment( 'left' ),
		},
		{
			icon: 'align-center',
			title: wp.i18n.__( 'Align center' ),
			isActive: ( { align } ) => ! align || 'center' === align,
			onClick: toggleAlignment( 'center' ),
		},
		{
			icon: 'align-right',
			title: wp.i18n.__( 'Align right' ),
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

	edit: GalleryBlockForm,

	save( { attributes } ) {
		const { images = [], align = 'none' } = attributes;
		const { columns = Math.min( 3, images.length ) } = attributes;
		return (
			<div className={ `blocks-gallery align${ align } columns-${ columns }` } >
				{ images.map( ( img ) => (
					<GalleryImage key={ img.url } img={ img } />
				) ) }
			</div>
		);
	},

} );
