/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { createElement } from 'element';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from '../../api';
import Editable from '../../editable';

const { children, prop } = hpq;

registerBlock( 'core/list', {
	title: __( 'List' ),
	icon: 'editor-ul',
	category: 'common',

	attributes: {
		nodeName: prop( 'ol,ul', 'nodeName' ),
		values: children( 'ol,ul' )
	},

	controls: [
		{
			icon: 'editor-ul',
			title: __( 'Convert to unordered' ),
			isActive: ( { nodeName = 'OL' } ) => nodeName === 'UL',
			onClick( attributes, setAttributes ) {
				setAttributes( { nodeName: 'UL' } );
			}
		},
		{
			icon: 'editor-ol',
			title: __( 'Convert to ordered' ),
			isActive: ( { nodeName = 'OL' } ) => nodeName === 'OL',
			onClick( attributes, setAttributes ) {
				setAttributes( { nodeName: 'OL' } );
			}
		}
	],

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { nodeName = 'OL', values = [] } = attributes;
		return (
			<Editable
				tagName={ nodeName.toLowerCase() }
				onChange={ ( nextValues ) => {
					setAttributes( { values: nextValues } );
				} }
				value={ values }
				focus={ focus }
				onFocus={ setFocus }
				showAlignments
				className="blocks-list" />
		);
	},

	save( { attributes } ) {
		const { nodeName = 'OL', values = [] } = attributes;

		return createElement(
			nodeName.toLowerCase(),
			null,
			values
		);
	}
} );
