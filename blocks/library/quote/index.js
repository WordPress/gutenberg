/**
 * External dependencies
 */
import { isString, isObject } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Toolbar } from '@wordpress/components';
import { source } from '@wordpress/block-api';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType } from '../../api';
import AlignmentToolbar from '../../alignment-toolbar';
import BlockControls from '../../block-controls';
import Editable from '../../editable';

const { children, node, query } = source;
const createTransformationBlock = ( name, attributes ) => ( { name, attributes } );

registerBlockType( 'core/quote', {
	title: __( 'Quote' ),
	icon: 'format-quote',
	category: 'common',

	attributes: {
		value: {
			type: 'array',
			source: query( 'blockquote > p', node() ),
			default: [],
		},
		citation: {
			type: 'array',
			source: children( 'footer' ),
		},
		align: {
			type: 'string',
		},
		style: {
			type: 'number',
			default: 1,
		},
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { content } ) => {
					return createTransformationBlock( 'core/quote', {
						value: [
							<p key="1">{ content }</p>,
						],
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { content } ) => {
					return createTransformationBlock( 'core/quote', {
						value: [
							<p key="1">{ content }</p>,
						],
					} );
				},
			},
			{
				type: 'pattern',
				regExp: /^>\s/,
				transform: ( { content } ) => {
					return createTransformationBlock( 'core/quote', {
						value: [
							<p key="1">{ content }</p>,
						],
					} );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { value, citation, ...attrs } ) => {
					const textElement = value[ 0 ];
					if ( ! textElement ) {
						return createTransformationBlock( 'core/paragraph', {
							content: citation,
						} );
					}
					const textContent = isString( textElement ) ? textElement : textElement.props.children;
					if ( Array.isArray( value ) || citation ) {
						const text = createTransformationBlock( 'core/paragraph', {
							content: textContent,
						} );
						const quote = createTransformationBlock( 'core/quote', {
							...attrs,
							citation,
							value: Array.isArray( value ) ? value.slice( 1 ) : '',
						} );

						return [ text, quote ];
					}
					return createTransformationBlock( 'core/paragraph', {
						content: textContent,
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { value, citation, ...attrs } ) => {
					const isMultiParagraph = Array.isArray( value ) && isObject( value[ 0 ] ) && value[ 0 ].type === 'p';
					const headingElement = isMultiParagraph ? value[ 0 ] : value;
					const headingContent = isObject( headingElement ) && value[ 0 ].type === 'p'
						? headingElement.props.children
						: headingElement;
					if ( isMultiParagraph || citation ) {
						const heading = createTransformationBlock( 'core/heading', {
							content: headingContent,
						} );
						const quote = createTransformationBlock( 'core/quote', {
							...attrs,
							citation,
							value: Array.isArray( value ) ? value.slice( 1 ) : '',
						} );

						return [ heading, quote ];
					}
					return createTransformationBlock( 'core/heading', {
						content: headingContent,
					} );
				},
			},
		],
	},

	edit( { attributes, setAttributes, focus, setFocus, mergeBlocks, className } ) {
		const { align, value, citation, style } = attributes;
		const focusedEditable = focus ? focus.editable || 'value' : null;

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
				className={ `${ className } blocks-quote-style-${ style }` }
			>
				<Editable
					multiline="p"
					value={ value }
					onChange={
						( nextValue ) => setAttributes( {
							value: nextValue,
						} )
					}
					focus={ focusedEditable === 'value' ? focus : null }
					onFocus={ ( props ) => setFocus( { ...props, editable: 'value' } ) }
					onMerge={ mergeBlocks }
					style={ { textAlign: align } }
					placeholder={ __( 'Write quote…' ) }
				/>
				{ ( ( citation && citation.length > 0 ) || !! focus ) && (
					<Editable
						tagName="footer"
						value={ citation }
						placeholder={ __( 'Write citation…' ) }
						onChange={
							( nextCitation ) => setAttributes( {
								citation: nextCitation,
							} )
						}
						focus={ focusedEditable === 'citation' ? focus : null }
						onFocus={ ( props ) => setFocus( { ...props, editable: 'citation' } ) }
					/>
				) }
			</blockquote>,
		];
	},

	save( { attributes } ) {
		const { align, value, citation, style } = attributes;

		return (
			<blockquote
				className={ `blocks-quote-style-${ style }` }
				style={ { textAlign: align ? align : null } }
			>
				{ value.map( ( paragraph, i ) => (
					<p key={ i }>{ paragraph.props.children }</p>
				) ) }
				{ citation && citation.length > 0 && (
					<footer>{ citation }</footer>
				) }
			</blockquote>
		);
	},
} );
