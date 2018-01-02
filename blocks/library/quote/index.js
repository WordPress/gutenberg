/**
 * External dependencies
 */
import { isString, get } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Toolbar } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import './editor.scss';
import { registerBlockType, createBlock } from '../../api';
import AlignmentToolbar from '../../alignment-toolbar';
import BlockControls from '../../block-controls';
import Editable from '../../editable';

const toEditableValue = value => value.map( ( subValue => subValue.children ) );
const fromEditableValue = value => value.map( ( subValue ) => ( {
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

registerBlockType( 'core/quote', {
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
					const textElement = value[ 0 ];
					if ( ! textElement ) {
						return createBlock( 'core/heading', {
							content: citation,
						} );
					}
					const textContent = isString( textElement.children ) ?
						textElement.children :
						textElement.children.props.children;
					if ( Array.isArray( value ) || citation ) {
						const text = createBlock( 'core/heading', {
							content: textContent,
						} );
						const quote = createBlock( 'core/quote', {
							...attrs,
							citation,
							value: Array.isArray( value ) ?
								value.slice( 1 ) :
								[],
						} );

						return [ text, quote ];
					}
					return createBlock( 'core/heading', {
						content: textContent,
					} );
				},
			},
		],
	},

	edit( { attributes, setAttributes, focus, setFocus, mergeBlocks, onReplace, className } ) {
		const { align, value, citation, style } = attributes;
		const focusedEditable = focus ? focus.editable || 'value' : null;
		const containerClassname = classnames( className, style === 2 ? 'is-large' : '' );

		return [
			focus && (
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
			>
				<Editable
					multiline="p"
					value={ toEditableValue( value ) }
					onChange={
						( nextValue ) => setAttributes( {
							value: fromEditableValue( nextValue ),
						} )
					}
					focus={ focusedEditable === 'value' ? focus : null }
					onFocus={ ( props ) => setFocus( { ...props, editable: 'value' } ) }
					onMerge={ mergeBlocks }
					onRemove={ ( forward ) => {
						const hasEmptyCitation = ! citation || citation.length === 0;
						if ( ! forward && hasEmptyCitation ) {
							onReplace( [] );
						}
					} }
					style={ { textAlign: align } }
					placeholder={ __( 'Write quote…' ) }
				/>
				{ ( ( citation && citation.length > 0 ) || !! focus ) && (
					<Editable
						tagName="cite"
						value={ citation }
						placeholder={ __( 'Write citation…' ) }
						onChange={
							( nextCitation ) => setAttributes( {
								citation: nextCitation,
							} )
						}
						focus={ focusedEditable === 'citation' ? focus : null }
						onFocus={ ( props ) => setFocus( { ...props, editable: 'citation' } ) }
						onRemove={ ( forward ) => {
							if ( ! forward ) {
								setFocus( { ...focus, editable: 'value' } );
							}
						} }
					/>
				) }
			</blockquote>,
		];
	},

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
} );
