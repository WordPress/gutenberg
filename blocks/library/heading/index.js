/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, createBlock, query } from '../../api';
import Editable from '../../editable';

const { children, prop } = query;

registerBlock( 'core/heading', {
	title: wp.i18n.__( 'Heading' ),

	icon: 'heading',

	category: 'common',

	attributes: {
		content: children( 'h1,h2,h3,h4,h5,h6' ),
		nodeName: prop( 'h1,h2,h3,h4,h5,h6', 'nodeName' ),
	},

	controls: [
		...'123456'.split( '' ).map( ( level ) => ( {
			icon: 'heading',
			title: wp.i18n.sprintf( wp.i18n.__( 'Heading %s' ), level ),
			isActive: ( { nodeName } ) => 'H' + level === nodeName,
			onClick( attributes, setAttributes ) {
				setAttributes( { nodeName: 'H' + level } );
			},
			subscript: level,
		} ) ),
	],

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { content, ...attrs } ) => {
					if ( Array.isArray( content ) ) {
						const heading = createBlock( 'core/heading', {
							content: content[ 0 ].props.children,
						} );
						const blocks = [ heading ];

						const remainingContent = content.slice( 1 );
						if ( remainingContent.length ) {
							const text = createBlock( 'core/text', {
								...attrs,
								content: remainingContent,
							} );
							blocks.push( text );
						}

						return blocks;
					}
					return createBlock( 'core/heading', {
						content,
					} );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { content } ) => {
					return createBlock( 'core/text', {
						content,
					} );
				},
			},
		],
	},

	merge( attributes, attributesToMerge ) {
		return {
			content: wp.element.concatChildren( attributes.content, attributesToMerge.content ),
		};
	},

	edit( { attributes, setAttributes, focus, setFocus, mergeWithPrevious } ) {
		const { content, nodeName = 'H2' } = attributes;

		return (
			<Editable
				tagName={ nodeName.toLowerCase() }
				value={ content }
				focus={ focus }
				onFocus={ setFocus }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				onMerge={ mergeWithPrevious }
				inline
			/>
		);
	},

	save( { attributes } ) {
		const { nodeName = 'H2', content } = attributes;
		const Tag = nodeName.toLowerCase();

		return (
			<Tag>
				{ content }
			</Tag>
		);
	},
} );
