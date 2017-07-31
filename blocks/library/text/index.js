/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { concatChildren } from 'element';

/**
 * Internal dependencies
 */
import './block.scss';
import { registerBlockType, createBlock, query as hpq, setDefaultBlock } from '../../api';
import AlignmentToolbar from '../../alignment-toolbar';
import BlockControls from '../../block-controls';
import Editable from '../../editable';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import BlockDescription from '../../block-description';

const { children, query } = hpq;

registerBlockType( 'core/text', {
	title: __( 'Text' ),

	icon: 'text',

	category: 'common',

	defaultAttributes: {
		dropCap: false,
	},

	className: false,

	attributes: {
		content: query( 'p', children() ),
	},

	transforms: {
		from: [
			{
				type: 'raw',
				matcher: ( node ) => (
					node.nodeName === 'P' &&
					// Do not allow embedded content.
					! node.querySelector( 'audio, canvas, embed, iframe, img, math, object, svg, video' )
				),
				attributes: {
					content: query( 'p', children() ),
				},
			},
		],
	},

	merge( attributes, attributesToMerge ) {
		return {
			content: concatChildren( attributes.content, attributesToMerge.content ),
		};
	},

	edit( { attributes, setAttributes, insertBlocksAfter, focus, setFocus, mergeBlocks, onReplace } ) {
		const { align, content, dropCap, placeholder } = attributes;
		const toggleDropCap = () => setAttributes( { dropCap: ! dropCap } );
		return [
			focus && (
				<BlockControls key="controls">
					<AlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
					/>
				</BlockControls>
			),
			focus && (
				<InspectorControls key="inspector">
					<BlockDescription>
						<p>{ __( 'Text. Great things start here.' ) }</p>
					</BlockDescription>
					<h3>{ __( 'Text Settings' ) }</h3>
					<ToggleControl
						label={ __( 'Drop Cap' ) }
						checked={ !! dropCap }
						onChange={ toggleDropCap }
					/>
				</InspectorControls>
			),
			<Editable
				tagName="p"
				key="editable"
				value={ content }
				onChange={ ( nextContent ) => {
					setAttributes( {
						content: nextContent,
					} );
				} }
				focus={ focus }
				onFocus={ setFocus }
				onSplit={ ( before, after, ...blocks ) => {
					setAttributes( { content: before } );
					insertBlocksAfter( [
						...blocks,
						createBlock( 'core/text', { content: after } ),
					] );
				} }
				onMerge={ mergeBlocks }
				onReplace={ onReplace }
				style={ { textAlign: align } }
				className={ dropCap && 'has-drop-cap' }
				placeholder={ placeholder || __( 'New Paragraph' ) }
			/>,
		];
	},

	save( { attributes } ) {
		const { align, content, dropCap } = attributes;
		const className = dropCap ? 'has-drop-cap' : null;

		if ( ! align ) {
			return <p className={ className }>{ content }</p>;
		}

		return <p style={ { textAlign: align } } className={ className }>{ content }</p>;
	},
} );

setDefaultBlock( 'core/text' );
