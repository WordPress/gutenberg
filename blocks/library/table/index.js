/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from 'api';
import Editable from 'components/editable';

const { children, prop } = hpq;

registerBlock( 'core/table', {
	title: wp.i18n.__( 'Table' ),
	icon: 'editor-table',
	category: 'common',

	attributes: {
		nodeName: prop( 'table', 'nodeName' ),
		values: children( 'tr' )
	},

	controls: [
		// {
		// 	icon: 'editor-table',
		// 	title: wp.i18n.__( 'Convert to unordered' ),
		// 	isActive: ( { nodeName = 'OL' } ) => nodeName === 'UL',
		// 	onClick( attributes, setAttributes ) {
		// 	}
		// },
	],

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { nodeName = 'TABLE', values = [] } = attributes;
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
				className="blocks-table" />
		);
	},

	save( { attributes } ) {
		const { nodeName = 'TABLE', values = [] } = attributes;

		return wp.element.createElement(
			nodeName.toLowerCase(),
			null,
			values
		);
	}
} );
