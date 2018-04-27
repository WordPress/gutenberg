/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { concatChildren, Fragment } from '@wordpress/element';
import { PanelBody, Toolbar } from '@wordpress/components';
import {
	createBlock,
	RichText,
	BlockControls,
	InspectorControls,
	AlignmentToolbar,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './editor.scss';

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

	edit( { attributes, setAttributes, mergeBlocks, insertBlocksAfter, onReplace, className } ) {
		const { align, content, nodeName, placeholder } = attributes;

		return (
			<Fragment>
				<BlockControls
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
				<InspectorControls>
					<PanelBody title={ __( 'Heading Settings' ) }>
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
					</PanelBody>
				</InspectorControls>
				<RichText
					wrapperClassName="wp-block-heading"
					tagName={ nodeName.toLowerCase() }
					value={ content }
					onChange={ ( value ) => setAttributes( { content: value } ) }
					onMerge={ mergeBlocks }
					onSplit={
						insertBlocksAfter ?
							( unused, after, ...blocks ) => {
								insertBlocksAfter( [
									...blocks,
									createBlock( 'core/paragraph', { content: after } ),
								] );
							} :
							undefined
					}
					onRemove={ () => onReplace( [] ) }
					style={ { textAlign: align } }
					className={ className }
					placeholder={ placeholder || __( 'Write heading…' ) }
				/>
			</Fragment>
		);
	},

	save( { attributes } ) {
		const { align, nodeName, content } = attributes;

		return (
			<RichText.Content
				tagName={ nodeName.toLowerCase() }
				style={ { textAlign: align } }
				value={ content }
			/>
		);
	},
};
