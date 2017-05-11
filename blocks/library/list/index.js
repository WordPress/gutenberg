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

	controls: [
		{
			icon: 'editor-ul',
			title: wp.i18n.__( 'Convert to unordered' ),
			isActive: ( { nodeName = 'OL' } ) => nodeName === 'UL',
			onClick( attributes, setAttributes ) {
				setAttributes( { nodeName: 'UL' } );
			},
		},
		{
			icon: 'editor-ol',
			title: wp.i18n.__( 'Convert to ordered' ),
			isActive: ( { nodeName = 'OL' } ) => nodeName === 'OL',
			onClick( attributes, setAttributes ) {
				setAttributes( { nodeName: 'OL' } );
			},
		},
	],

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { content } ) => {
					return createBlock( 'core/list', {
						nodeName: 'ul',
						values: switchChildrenNodeName( content, 'li' )
					} );
				}
			},
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { content } ) => {
					return createBlock( 'core/list', {
						nodeName: 'ul',
						values: [ <li key="1">{ content }</li> ]
					} );
				}
			}
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { values } ) => {
					return createBlock( 'core/text', {
						content: switchChildrenNodeName( values, 'p' )
					} );
				}
			},
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { values, ...attrs } ) => {
					if ( Array.isArray( values ) ) {
						const heading = createBlock( 'core/heading', {
							content: values[ 0 ].props.children
						} );
						const blocks = [ heading ];

						const remainingValues = values.slice( 1 );
						if ( remainingValues.length ) {
							const list = createBlock( 'core/list', {
								...attrs,
								values: remainingValues
							} );
							blocks.push( list );
						}

						return blocks;
					}
					return createBlock( 'core/heading', {
						values
					} );
				}
			}
		]
	},

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

		return wp.element.createElement(
			nodeName.toLowerCase(),
			null,
			values
		);
	},
} );
