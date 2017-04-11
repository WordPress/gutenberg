/**
 * Internal dependencies
 */
import './style.scss';

const Editable = wp.blocks.Editable;
const { html, prop, query, parse } = wp.blocks.query;

const parseAttrs = {
	listType: prop( 'ol,ul', 'nodeName' ),
	items: query(
		'li',
		{
			value: ( node ) => {
				return html()( node );
			}
		}
	)
};

wp.blocks.registerBlock( 'core/list', {
	title: wp.i18n.__( 'List' ),
	icon: 'editor-ul',
	category: 'common',

	attributes: parseAttrs,

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
		},
		{
			icon: 'editor-justify',
			title: wp.i18n.__( 'Justify' ),
			isActive: ( { align } ) => 'justify' === align,
			onClick( attributes, setAttributes ) {
				setAttributes( { align: 'justify' } );
			}
		},

		{
			icon: 'editor-ul',
			title: wp.i18n.__( 'Convert to unordered' ),
			isActive: ( { } ) => false, // To be implemented
			onClick( attributes, setAttributes ) {
				setAttributes( { listType: 'ul' } );
			}
		}

	],

	edit( { attributes, setAttributes } ) {
		const { listType = 'ol', items = [], align } = attributes;
		const content = items.map( item => {
			return `<li>${ item.value }</li>`;
		} ).join( '' );
		return (
			<Editable
				tagName={ listType }
				style={ align ? { textAlign: align } : null }
				onChange={ ( v, node ) => {
					// The node is getting passed through from Tiny.
					// Is there a way to parse this with hpq that doesn't
					// involve a string?
					const attrs = parse( '<' + node.nodeName + '>' + v + '</' + node.nodeName + '>', parseAttrs );
					setAttributes( attrs );
				} }
				value={ content }
				className="blocks-list" />
		);
	},

	save( { attributes } ) {
		const { listType = 'ol', items = [] } = attributes;
		const ListType = listType.toLowerCase();
		const inner = items.map( item => {
			return `<li>${ item.value }</li>`;
		} ).join( '' );

		return (
			<ListType
				dangerouslySetInnerHTML={ { __html: inner } } />
		);
	}
} );
