/**
 * External dependencies
 */
import { castArray, get, isString } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Toolbar, withState } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import './editor.scss';
import { createBlock } from '../../api';
import AlignmentToolbar from '../../alignment-toolbar';
import BlockControls from '../../block-controls';
import RichText from '../../rich-text';

const toRichTextValue = value => value.map( ( subValue => subValue.children ) );
const fromRichTextValue = value => value.map( ( subValue ) => ( {
	children: subValue,
} ) );

const blockAttributes = {
	value: {
		type: 'array',
		source: 'query',
		selector: 'blockquote > p',
		query: {
			children: {
				source: 'node',
			},
		},
		default: [],
	},
	citation: {
		type: 'array',
		source: 'children',
		selector: 'cite',
	},
	align: {
		type: 'string',
	},
	style: {
		type: 'number',
		default: 1,
	},
};

export const name = 'core/quote';

export const settings = {
	title: __( 'Quote' ),
	description: __( 'Quote. In quoting others, we cite ourselves. (Julio Cortázar)' ),
	icon: 'format-quote',
	category: 'common',

	attributes: blockAttributes,

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { content } ) => {
					return createBlock( 'core/quote', {
						value: [
							{ children: <p key="1">{ content }</p> },
						],
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { content } ) => {
					return createBlock( 'core/quote', {
						value: [
							{ children: <p key="1">{ content }</p> },
						],
					} );
				},
			},
			{
				type: 'pattern',
				regExp: /^>\s/,
				transform: ( { content } ) => {
					return createBlock( 'core/quote', {
						value: [
							{ children: <p key="1">{ content }</p> },
						],
					} );
				},
			},
			{
				type: 'raw',
				isMatch: ( node ) => node.nodeName === 'BLOCKQUOTE',
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { value, citation } ) => {
					// transforming an empty quote
					if ( ( ! value || ! value.length ) && ! citation ) {
						return createBlock( 'core/paragraph' );
					}
					// transforming a quote with content
					return ( value || [] ).map( item => createBlock( 'core/paragraph', {
						content: [ get( item, 'children.props.children', '' ) ],
					} ) ).concat( citation ? createBlock( 'core/paragraph', {
						content: citation,
					} ) : [] );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { value, citation, ...attrs } ) => {
					// if no text content exist just transform the quote into an heading block
					// using citation as the content, it may be empty creating an empty heading block.
					if ( ( ! value || ! value.length ) ) {
						return createBlock( 'core/heading', {
							content: citation,
						} );
					}

					const firstValue = get( value, [ 0, 'children' ] );
					const headingContent = castArray( isString( firstValue ) ?
						firstValue :
						get( firstValue, [ 'props', 'children' ], '' )
					);

					// if the quote content just contains a paragraph and no citation exist
					// convert the quote content into and heading block.
					if ( ! citation && value.length === 1 ) {
						return createBlock( 'core/heading', {
							content: headingContent,
						} );
					}

					// In the normal case convert the first paragraph of quote into an heading
					// and create a new quote block equal tl what we had excluding the first paragraph
					const heading = createBlock( 'core/heading', {
						content: headingContent,
					} );

					const quote = createBlock( 'core/quote', {
						...attrs,
						citation,
						value: value.slice( 1 ),
					} );

					return [ heading, quote ];
				},
			},
		],
	},

	edit: withState( {
		editable: 'content',
	} )( ( { attributes, setAttributes, isSelected, mergeBlocks, onReplace, className, editable, setState } ) => {
		const { align, value, citation, style } = attributes;
		const containerClassname = classnames( className, style === 2 ? 'is-large' : '' );
		const onSetActiveEditable = ( newEditable ) => () => {
			setState( { editable: newEditable } );
		};

		return [
			isSelected && (
				<BlockControls key="controls">
					<Toolbar controls={ [ 1, 2 ].map( ( variation ) => ( {
						icon: 1 === variation ? 'format-quote' : 'testimonial',
						title: sprintf( __( 'Quote style %d' ), variation ),
						isActive: Number( style ) === variation,
						onClick() {
							setAttributes( { style: variation } );
						},
					} ) ) } />
					<AlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
					/>
				</BlockControls>
			),
			<blockquote
				key="quote"
				className={ containerClassname }
				style={ { textAlign: align } }
			>
				<RichText
					multiline="p"
					value={ toRichTextValue( value ) }
					onChange={
						( nextValue ) => setAttributes( {
							value: fromRichTextValue( nextValue ),
						} )
					}
					onMerge={ mergeBlocks }
					onRemove={ ( forward ) => {
						const hasEmptyCitation = ! citation || citation.length === 0;
						if ( ! forward && hasEmptyCitation ) {
							onReplace( [] );
						}
					} }
					placeholder={ __( 'Write quote…' ) }
					isSelected={ isSelected && editable === 'content' }
					onFocus={ onSetActiveEditable( 'content' ) }
				/>
				{ ( ( citation && citation.length > 0 ) || isSelected ) && (
					<RichText
						tagName="cite"
						value={ citation }
						onChange={
							( nextCitation ) => setAttributes( {
								citation: nextCitation,
							} )
						}
						placeholder={ __( 'Write citation…' ) }
						isSelected={ isSelected && editable === 'cite' }
						onFocus={ onSetActiveEditable( 'cite' ) }
					/>
				) }
			</blockquote>,
		];
	} ),

	save( { attributes } ) {
		const { align, value, citation, style } = attributes;

		return (
			<blockquote
				className={ style === 2 ? 'is-large' : '' }
				style={ { textAlign: align ? align : null } }
			>
				{ value.map( ( paragraph, i ) => (
					<p key={ i }>{ paragraph.children && paragraph.children.props.children }</p>
				) ) }
				{ citation && citation.length > 0 && (
					<cite>{ citation }</cite>
				) }
			</blockquote>
		);
	},

	deprecated: [
		{
			attributes: {
				...blockAttributes,
				citation: {
					type: 'array',
					source: 'children',
					selector: 'footer',
				},
			},

			save( { attributes } ) {
				const { align, value, citation, style } = attributes;

				return (
					<blockquote
						className={ `blocks-quote-style-${ style }` }
						style={ { textAlign: align ? align : null } }
					>
						{ value.map( ( paragraph, i ) => (
							<p key={ i }>{ paragraph.children && paragraph.children.props.children }</p>
						) ) }
						{ citation && citation.length > 0 && (
							<footer>{ citation }</footer>
						) }
					</blockquote>
				);
			},
		},
	],
};
