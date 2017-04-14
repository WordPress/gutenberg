/**
 * Internal dependencies
 */
import { registerBlock, query } from 'api';
import Editable from 'components/editable';

const { html, prop } = query;

registerBlock( 'core/heading', {
	title: wp.i18n.__( 'Heading' ),

	icon: 'heading',

	category: 'common',

	attributes: {
		content: html( 'h1,h2,h3,h4,h5,h6' ),
		tag: prop( 'h1,h2,h3,h4,h5,h6', 'nodeName' ),
		align: prop( 'h1,h2,h3,h4,h5,h6', 'style.textAlign' )
	},

	controls: [
		{
			icon: 'editor-alignleft',
			title: wp.i18n.__( 'Align left' ),
			isActive: ( { align } ) => ! align || 'left' === align,
			onClick( attributes, setAttributes ) {
				setAttributes( { align: undefined } );
			}
		},
		{
			icon: 'editor-aligncenter',
			title: wp.i18n.__( 'Align center' ),
			isActive: ( { align } ) => 'center' === align,
			onClick( attributes, setAttributes ) {
				setAttributes( { align: 'center' } );
			}
		},
		{
			icon: 'editor-alignright',
			title: wp.i18n.__( 'Align right' ),
			isActive: ( { align } ) => 'right' === align,
			onClick( attributes, setAttributes ) {
				setAttributes( { align: 'right' } );
			}
		}
	],

	edit( { attributes, setAttributes } ) {
		const { content, tag, align } = attributes;

		return (
			<Editable
				tagName={ tag }
				value={ content }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				style={ align ? { textAlign: align } : null }
			/>
		);
	},

	save( { attributes } ) {
		const { align, tag, content } = attributes;
		const Tag = tag;

		return (
			<Tag
				style={ align ? { textAlign: align } : null }
				dangerouslySetInnerHTML={ { __html: content } } />
		);
	}
} );
