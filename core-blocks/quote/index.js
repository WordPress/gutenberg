/**
 * External dependencies
 */
import classnames from 'classnames';
import { castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Toolbar, withState } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import {
	createBlock,
	rawHandler,
	BlockControls,
	AlignmentToolbar,
	RichText,
	InnerBlocks,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import './editor.scss';

const blockAttributes = {
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
			...[ 'core/paragraph', 'core/heading' ].map( ( fromName ) => ( {
				type: 'block',
				blocks: [ fromName ],
				transform: ( attributes ) => createBlock( name, {}, [
					createBlock( fromName, attributes ),
				] ),
			} ) ),
			{
				type: 'pattern',
				regExp: /^>\s/,
				transform: ( attributes ) => createBlock( name, {}, [
					createBlock( 'core/paragraph', attributes ),
				] ),
			},
			{
				type: 'raw',
				isMatch: ( node ) => node.nodeName === 'BLOCKQUOTE',
				transform( node ) {
					return createBlock( name, {}, rawHandler( {
						HTML: node.innerHTML,
						mode: 'BLOCKS',
					} ) );
				},
			},
		],
	},

	edit: withState( {
		editable: 'content',
	} )( ( { attributes, setAttributes, isSelected, className, editable, setState } ) => {
		const { align, citation, style } = attributes;
		const containerClassname = classnames( className, style === 2 ? 'is-large' : '' );
		const onSetActiveEditable = ( newEditable ) => () => {
			setState( { editable: newEditable } );
		};

		return (
			<Fragment>
				<BlockControls>
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
				<blockquote
					className={ containerClassname }
					style={ { textAlign: align } }
				>
					<InnerBlocks />
					{ ( ( citation && citation.length > 0 ) || isSelected ) && (
						<RichText
							tagName="cite"
							value={ citation }
							onChange={
								( nextCitation ) => setAttributes( {
									citation: nextCitation,
								} )
							}
							/* translators: the individual or entity quoted */
							placeholder={ __( 'Write citation…' ) }
							isSelected={ isSelected && editable === 'cite' }
							onFocus={ onSetActiveEditable( 'cite' ) }
						/>
					) }
				</blockquote>
			</Fragment>
		);
	} ),

	save( { attributes } ) {
		const { align, citation, style } = attributes;

		return (
			<blockquote
				className={ style === 2 ? 'is-large' : '' }
				style={ { textAlign: align ? align : null } }
			>
				<InnerBlocks.Content />
				{ citation && citation.length > 0 && <RichText.Content tagName="cite" value={ citation } /> }
			</blockquote>
		);
	},

	deprecated: [
		{
			attributes: {
				...blockAttributes,
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
			},

			migrate( { value = [], ...attributes } ) {
				return [
					attributes,
					value.map( ( { children: paragraph } ) =>
						createBlock( 'core/paragraph', {
							content: castArray( paragraph.props.children ),
						} )
					),
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
						{ citation && citation.length > 0 && <RichText.Content tagName="cite" value={ citation } /> }
					</blockquote>
				);
			},
		},
		{
			attributes: {
				...blockAttributes,
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
						{ citation && citation.length > 0 && <RichText.Content tagName="footer" value={ citation } /> }
					</blockquote>
				);
			},
		},
	],
};
