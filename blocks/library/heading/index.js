/**
 * External dependencies
 */
import { isObject } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from 'i18n';
import { concatChildren } from 'element';
import { Toolbar } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, createBlock, query } from '../../api';
import Editable from '../../editable';
import BlockControls from '../../block-controls';
import InspectorControls from '../../inspector-controls';
import AlignmentToolbar from '../../alignment-toolbar';
import BlockDescription from '../../block-description';

const { children, prop } = query;

registerBlockType( 'core/heading', {
	title: __( 'Heading' ),

	icon: 'heading',

	category: 'common',

	className: false,

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
					const isMultiParagraph = Array.isArray( content ) && isObject( content[ 0 ] ) && content[ 0 ].type === 'p';
					if ( isMultiParagraph ) {
						const headingContent = isObject( content[ 0 ] ) && content[ 0 ].type === 'p'
							? content[ 0 ].props.children
							: content[ 0 ];
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
			{
				type: 'raw',
				matcher: ( node ) => /H\d/.test( node.nodeName ),
				attributes: {
					content: children( 'h1,h2,h3,h4,h5,h6' ),
					nodeName: prop( 'h1,h2,h3,h4,h5,h6', 'nodeName' ),
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
			content: concatChildren( attributes.content, attributesToMerge.content ),
		};
	},

	edit( { attributes, setAttributes, focus, setFocus, mergeBlocks, insertBlocksAfter } ) {
		const { align, content, nodeName = 'H2' } = attributes;

		return [
			focus && (
				<BlockControls
					key="controls"
					controls={
						'234'.split( '' ).map( ( level ) => ( {
							icon: 'heading',
							title: sprintf( __( 'Heading %s' ), level ),
							isActive: 'H' + level === nodeName,
							onClick: () => setAttributes( { nodeName: 'H' + level } ),
							subscript: level,
						} ) )
					}
				/>
			),
			focus && (
				<InspectorControls key="inspector">
					<BlockDescription>
						<p>{ __( 'Search engines use the headings to index the structure and content of your web pages.' ) }</p>
					</BlockDescription>
					<h3>{ __( 'Heading Settings' ) }</h3>
					<p>{ __( 'Size' ) }</p>
					<Toolbar
						controls={
							'123456'.split( '' ).map( ( level ) => ( {
								icon: 'heading',
								title: sprintf( __( 'Heading %s' ), level ),
								isActive: 'H' + level === nodeName,
								onClick: () => setAttributes( { nodeName: 'H' + level } ),
								subscript: level,
							} ) )
						}
					/>
					<p>{ __( 'Text Alignment' ) }</p>
					<AlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
					/>
				</InspectorControls>
			),
			<Editable
				key="editable"
				tagName={ nodeName.toLowerCase() }
				value={ content }
				focus={ focus }
				onFocus={ setFocus }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				onMerge={ mergeBlocks }
				onSplit={ ( before, after, ...blocks ) => {
					setAttributes( { content: before } );
					insertBlocksAfter( [
						...blocks,
						createBlock( 'core/text', { content: after } ),
					] );
				} }
				style={ { textAlign: align } }
				placeholder={ __( 'Write heading…' ) }
			/>,
		];
	},

	save( { attributes } ) {
		const { align, nodeName = 'H2', content } = attributes;
		const Tag = nodeName.toLowerCase();

		return (
			<Tag style={ { textAlign: align } } >
				{ content }
			</Tag>
		);
	},
} );
