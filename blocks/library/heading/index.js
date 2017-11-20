/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { concatChildren } from '@wordpress/element';
import { Toolbar } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import { registerBlockType, createBlock } from '../../api';
import Editable from '../../editable';
import BlockControls from '../../block-controls';
import InspectorControls from '../../inspector-controls';
import AlignmentToolbar from '../../alignment-toolbar';
import BlockDescription from '../../block-description';

registerBlockType( 'core/heading', {
	title: __( 'Heading' ),

	icon: 'heading',

	category: 'common',

	keywords: [ __( 'title' ), __( 'subtitle' ) ],

	supports: {
		generatedClassName: false,
		anchor: true,
	},

	attributes: {
		content: {
			type: 'array',
			source: 'children',
			selector: 'h1,h2,h3,h4,h5,h6',
		},
		nodeName: {
			type: 'string',
			source: 'property',
			selector: 'h1,h2,h3,h4,h5,h6',
			property: 'nodeName',
			default: 'H2',
		},
		align: {
			type: 'string',
		},
		placeholder: {
			type: 'string',
		},
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { content } ) => {
					return createBlock( 'core/heading', {
						content,
					} );
				},
			},
			{
				type: 'raw',
				isMatch: ( node ) => /H\d/.test( node.nodeName ),
			},
			{
				type: 'pattern',
				regExp: /^(#{2,6})\s/,
				transform: ( { content, match } ) => {
					const level = match[ 1 ].length;

					return createBlock( 'core/heading', {
						nodeName: `H${ level }`,
						content,
					} );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { content } ) => {
					return createBlock( 'core/paragraph', {
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
		const { align, content, nodeName, placeholder } = attributes;

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
						createBlock( 'core/paragraph', { content: after } ),
					] );
				} }
				style={ { textAlign: align } }
				placeholder={ placeholder || __( 'Write heading…' ) }
			/>,
		];
	},

	save( { attributes } ) {
		const { align, nodeName, content } = attributes;
		const Tag = nodeName.toLowerCase();

		return (
			<Tag style={ { textAlign: align } } >
				{ content }
			</Tag>
		);
	},
} );
