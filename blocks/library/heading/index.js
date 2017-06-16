/**
 * External dependencies
 */
import { isString } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, createBlock, query } from '../../api';
import Editable from '../../editable';
import BlockControls from '../../block-controls';

const { children, prop } = query;

registerBlockType( 'core/heading', {
	title: wp.i18n.__( 'Heading' ),

	icon: 'heading',

	category: 'common',

	attributes: {
		content: children( 'h1,h2,h3,h4,h5,h6' ),
		nodeName: prop( 'h1,h2,h3,h4,h5,h6', 'nodeName' ),
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { content, ...attrs } ) => {
					if ( Array.isArray( content ) ) {
						const headingContent = isString( content[ 0 ] )
							? content[ 0 ]
							: content[ 0 ].props.children;
						const heading = createBlock( 'core/heading', {
							content: headingContent,
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

	edit( { attributes, setAttributes, focus, setFocus, mergeBlocks, insertBlockAfter } ) {
		const { content, nodeName = 'H2' } = attributes;

		return [
			focus && (
				<BlockControls
					key="controls"
					controls={
						'123456'.split( '' ).map( ( level ) => ( {
							icon: 'heading',
							title: wp.i18n.sprintf( wp.i18n.__( 'Heading %s' ), level ),
							isActive: 'H' + level === nodeName,
							onClick: () => setAttributes( { nodeName: 'H' + level } ),
							subscript: level,
						} ) )
					}
				/>
			),
			<Editable
				key="editable"
				tagName={ nodeName.toLowerCase() }
				value={ content }
				focus={ focus }
				onFocus={ setFocus }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				onMerge={ mergeBlocks }
				inline
				onSplit={ ( before, after ) => {
					setAttributes( { content: before } );
					insertBlockAfter( createBlock( 'core/text', {
						content: after,
					} ) );
				} }
			/>,
		];
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
