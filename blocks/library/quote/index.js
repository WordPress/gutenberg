/**
 * External dependencies
 */
import { isString } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from 'api';
import Editable from 'components/editable';

const { children, query, attr } = hpq;

registerBlock( 'core/quote', {
	title: wp.i18n.__( 'Quote' ),
	icon: 'format-quote',
	category: 'common',

	attributes: {
		value: query( 'blockquote > p', children() ),
		citation: children( 'footer' ),
		style: ( node ) => {
			const value = attr( 'blockquote', 'class' )( node );
			if ( ! value ) {
				return;
			}

			const match = value.match( /\bblocks-quote-style-(\d+)\b/ );
			if ( ! match ) {
				return;
			}

			return Number( match[ 1 ] );
		}
	},

	controls: [ 1, 2 ].map( ( variation ) => ( {
		icon: 'format-quote',
		title: wp.i18n.sprintf( wp.i18n.__( 'Quote style %d' ), variation ),
		isActive: ( { style = 1 } ) => style === variation,
		onClick( attributes, setAttributes ) {
			setAttributes( { style: variation } );
		},
		subscript: variation
	} ) ),

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { content } ) => {
					return {
						value: content
					};
				}
			},
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { content } ) => {
					return {
						value: content
					};
				}
			}
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { value, citation } ) => {
					return {
						content: wp.element.concatChildren( value, citation )
					};
				}
			},
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { value, citation } ) => {
					if ( Array.isArray( value ) ) {
						value = wp.element.concatChildren( value.map( ( elt ) =>
							! elt || isString( elt ) || elt.type !== 'p' ? elt : elt.props.children
						) );
					}
					return {
						nodeName: 'H2',
						content: wp.element.concatChildren( value, citation )
					};
				}
			}
		]
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { value, citation, style = 1 } = attributes;
		const focusedEditable = focus ? focus.editable || 'value' : null;

		return (
			<blockquote className={ `blocks-quote blocks-quote-style-${ style }` }>
				<Editable
					value={ value }
					onChange={
						( nextValue ) => setAttributes( {
							value: nextValue
						} )
					}
					focus={ focusedEditable === 'value' ? focus : null }
					onFocus={ () => setFocus( { editable: 'value' } ) }
					showAlignments
				/>
				{ ( citation || !! focus ) && (
					<footer>
						<Editable
							value={ citation }
							onChange={
								( nextCitation ) => setAttributes( {
									citation: nextCitation
								} )
							}
							focus={ focusedEditable === 'citation' ? focus : null }
							onFocus={ () => setFocus( { editable: 'citation' } ) }
						/>
					</footer>
				) }
			</blockquote>
		);
	},

	save( { attributes } ) {
		const { value, citation, style = 1 } = attributes;

		return (
			<blockquote className={ `blocks-quote-style-${ style }` }>
				{ value && wp.element.Children.map( value, ( paragraph, i ) => (
					<p key={ i }>{ paragraph }</p>
				) ) }
				<footer>{ citation }</footer>
			</blockquote>
		);
	}
} );
