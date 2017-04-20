/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from 'api';
import Editable from 'components/editable';

const { children, prop, query } = hpq;

registerBlock( 'core/list', {
	title: wp.i18n.__( 'List' ),
	icon: 'editor-ul',
	category: 'common',

	attributes: {
		nodeName: prop( 'ol,ul', 'nodeName' ),
		items: query( 'li', {
			value: children()
		} )
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
		},
		{
			icon: 'editor-justify',
			title: wp.i18n.__( 'Justify' ),
			isActive: ( { align } ) => 'justify' === align,
			onClick( attributes, setAttributes ) {
				setAttributes( { align: 'justify' } );
			}
		}
	],

	edit( { attributes, focus, setFocus } ) {
		const { nodeName = 'OL', items = [], align } = attributes;
		const content = items.map( ( item, i ) => {
			return <li key={ i }>{ item.value }</li>;
		} );

		return (
			<Editable
				tagName={ nodeName.toLowerCase() }
				style={ align ? { textAlign: align } : null }
				value={ content }
				focus={ focus }
				onFocus={ setFocus }
				className="blocks-list" />
		);
	},

	save( { attributes } ) {
		const { nodeName = 'OL', items = [] } = attributes;

		return wp.element.createElement(
			listType.toLowerCase(),
			null,
			items.map( ( item, index ) => (
				<li key={ index }>{ item.value }</li>
			) )
		);
	}
} );
