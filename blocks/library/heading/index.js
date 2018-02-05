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
import { createBlock } from '../../api';
import RichText from '../../rich-text';
import BlockControls from '../../block-controls';
import InspectorControls from '../../inspector-controls';
import AlignmentToolbar from '../../alignment-toolbar';

export const name = 'core/heading';

export const settings = {
	title: __( 'Heading' ),

	description: __( 'Search engines use the headings to index the structure and content of your web pages.' ),

	icon: 'heading',

	category: 'common',

	keywords: [ __( 'title' ), __( 'subtitle' ) ],

	supports: {
		className: false,
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

	edit( { attributes, setAttributes, isSelected, mergeBlocks, insertBlocksAfter, onReplace } ) {
		const { align, content, nodeName, placeholder } = attributes;

		return [
			isSelected && (
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
			isSelected && (
				<InspectorControls key="inspector">
					<h3>{ __( 'Heading Settings' ) }</h3>
					<p>{ __( 'Level' ) }</p>
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
			<RichText
				key="editable"
				wrapperClassName="wp-block-heading"
				tagName={ nodeName.toLowerCase() }
				value={ content }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				onMerge={ mergeBlocks }
				onSplit={
					insertBlocksAfter ?
						( before, after, ...blocks ) => {
							setAttributes( { content: before } );
							insertBlocksAfter( [
								...blocks,
								createBlock( 'core/paragraph', { content: after } ),
							] );
						} :
						undefined
				}
				onRemove={ () => onReplace( [] ) }
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
};
