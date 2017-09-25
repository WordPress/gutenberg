/**
 * External dependencies
 */
import { isString, isObject } from 'lodash';
import { parse } from 'hpq';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Toolbar } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, createBlock, source } from '../../api';
import AlignmentToolbar from '../../alignment-toolbar';
import BlockControls from '../../block-controls';
import Editable from '../../editable';
import InspectorControls from '../../inspector-controls';
import BlockDescription from '../../block-description';

const { html, query } = source;

registerBlockType( 'core/quote', {
	title: __( 'Quote' ),
	icon: 'format-quote',
	category: 'common',

	attributes: {
		value: {
			type: 'array',
			source: query( 'blockquote > p', html() ), // Need a better matcher joining the values
			default: [],
		},
		citation: {
			type: 'string',
			source: html( 'footer' ),
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
					return createBlock( 'core/quote', {
						value: [
							`<p>${ content }</p>`,
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
							`<p>${ content }</p>`,
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
							`<p>${ content }</p>`,
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
				transform: ( { value, citation, ...attrs } ) => {
					const textElement = value[ 0 ];
					if ( ! textElement && value.length === 1 ) {
						return createBlock( 'core/paragraph', {
							content: citation,
						} );
					}
					if ( value.length > 1 || citation ) {
						const text = createBlock( 'core/paragraph', {
							content: value[ 0 ],
						} );
						const quote = createBlock( 'core/quote', {
							...attrs,
							citation,
							value: value.slice( 1 ),
						} );

						return [ text, quote ];
					}
					return createBlock( 'core/paragraph', {
						content: value[ 0 ],
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { value, citation, ...attrs } ) => {
					const textElement = value[ 0 ];
					if ( ! textElement && value.length === 1 ) {
						return createBlock( 'core/heading', {
							content: citation,
						} );
					}
					if ( value.length > 1 || citation ) {
						const heading = createBlock( 'core/heading', {
							content: value[ 0 ],
						} );
						const quote = createBlock( 'core/quote', {
							...attrs,
							citation,
							value: value.slice( 1 ),
						} );

						return [ heading, quote ];
					}
					return createBlock( 'core/heading', {
						content: value[ 0 ],
					} );
				},
			},
		],
	},

	edit( { attributes, setAttributes, focus, setFocus, mergeBlocks, className } ) {
		const { align, value, citation, style } = attributes;
		const focusedEditable = focus ? focus.editable || 'value' : null;
		const valueToString = ( val ) => val.map( ( content ) => `<p>${ content }</p>` ).join();
		const stringToValue = ( val ) => parse( val, query( 'blockquote > p', html() ) );

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
			focus && (
				<InspectorControls key="inspector">
					<BlockDescription>
						<p>{ __( 'Quote. In quoting others, we cite ourselves. (Julio Cortázar)' ) }</p>
					</BlockDescription>
				</InspectorControls>
			),
			<blockquote
				key="quote"
				className={ `${ className } blocks-quote-style-${ style }` }
			>
				<Editable
					multiline="p"
					value={ valueToString( value ) }
					onChange={
						( nextValue ) => setAttributes( {
							value: stringToValue( nextValue ),
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
					<Editable.Value tagName="p" key={ i }>{ paragraph }</Editable.Value>
				) ) }
				{ citation && citation.length > 0 && (
					<Editable.Value tagName="footer">{ citation }</Editable.Value>
				) }
			</blockquote>
		);
	},
} );
