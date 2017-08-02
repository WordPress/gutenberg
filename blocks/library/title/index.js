/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
// import './block.scss';
import { registerBlockType, createBlock, query as hpq } from '../../api';
import Editable from '../../editable';
import BlockControls from '../../block-controls';
import AlignmentToolbar from '../../alignment-toolbar';
import InspectorControls from '../../inspector-controls';
import BlockDescription from '../../block-description';

const { children } = hpq;

registerBlockType( 'core/title', {
	title: __( 'Title' ),

	icon: 'heading',

	category: 'common',

	useOnce: true,

	className: false,

	attributes: {
		content: children( 'h1' ),
	},

	transforms: {
		from: [
			{
				type: 'pattern',
				regExp: /^#\s/,
				transform: ( { content } ) => {
					return createBlock( 'core/title', {
						content,
					} );
				},
			},
		],
	},

	edit( { attributes, setAttributes, focus, setFocus, mergeBlocks, insertBlocksAfter } ) {
		const { align, content, placeholder } = attributes;

		return [
			focus && (
				<InspectorControls key="inspector">
					<BlockDescription>
						<p>{ __( 'This is the document’s title. Usually it’s placed at the very top.' ) }</p>
					</BlockDescription>
				</InspectorControls>
			),
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
			<Editable
				key="editor"
				tagName="h1"
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
				placeholder={ placeholder || __( 'Write title…' ) }
			/>,
		];
	},

	save( { attributes } ) {
		const { align, content } = attributes;

		return (
			<h1 style={ { textAlign: align } }>
				{ content }
			</h1>
		);
	},
} );
