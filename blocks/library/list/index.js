/**
 * WordPress dependencies
 */
import { switchChildrenNodeName } from 'element';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq, createBlock } from '../../api';
import Editable from '../../editable';

const { children, prop } = hpq;

registerBlock( 'core/list', {
	title: wp.i18n.__( 'List' ),
	icon: 'editor-ul',
	category: 'common',

	attributes: {
		nodeName: prop( 'ol,ul', 'nodeName' ),
		values: children( 'ol,ul' ),
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { content } ) => {
					return createBlock( 'core/list', {
						nodeName: 'ul',
						values: switchChildrenNodeName( content, 'li' ),
					} );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { values } ) => {
					return createBlock( 'core/text', {
						content: switchChildrenNodeName( values, 'p' ),
					} );
				},
			},
		],
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { nodeName = 'OL', values = [] } = attributes;
		return (
			<Editable
				tagName={ nodeName.toLowerCase() }
				onChange={ ( nextValues ) => setAttributes( { values: nextValues } ) }
				onListChange={ ( listType ) => setAttributes( { nodeName: listType } ) }
				value={ values }
				focus={ focus }
				onFocus={ setFocus }
				showAlignments
				className="blocks-list" />
		);
	},

	save( { attributes } ) {
		const { nodeName = 'OL', values = [] } = attributes;

		return wp.element.createElement(
			nodeName.toLowerCase(),
			null,
			values
		);
	},
} );
