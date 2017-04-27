/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from 'api';
import Editable from 'components/editable';

const { children, query, attr, prop } = hpq;

registerBlock( 'core/quote', {
	title: wp.i18n.__( 'Quote' ),
	icon: 'format-quote',
	category: 'common',

	attributes: {
		value: query( 'blockquote > p', children() ),
		citation: children( 'footer' ),
		align: prop( 'blockquote', 'style.textAlign' ),
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

	controls: [
		[
			{
				icon: 'editor-alignleft',
				title: wp.i18n.__( 'Align left' ),
				isActive: ( { align } ) => ! align || 'left' === align,
				onClick( attributes, setAttributes ) {
					setAttributes( { align: undefined } );
				}
			},
			{
				icon: 'editor-aligncenter',
				title: wp.i18n.__( 'Align center' ),
				isActive: ( { align } ) => 'center' === align,
				onClick( attributes, setAttributes ) {
					setAttributes( { align: 'center' } );
				}
			},
			{
				icon: 'editor-alignright',
				title: wp.i18n.__( 'Align right' ),
				isActive: ( { align } ) => 'right' === align,
				onClick( attributes, setAttributes ) {
					setAttributes( { align: 'right' } );
				}
			}
		],
		[ 1, 2 ].map( ( variation ) => ( {
			icon: 'format-quote',
			title: wp.i18n.sprintf( wp.i18n.__( 'Quote style %d' ), variation ),
			isActive: ( { style = 1 } ) => style === variation,
			onClick( attributes, setAttributes ) {
				setAttributes( { style: variation } );
			},
			subscript: variation
		} ) )
	],

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { align, value, citation, style = 1 } = attributes;

		return (
			<blockquote
				className={ `blocks-quote blocks-quote-style-${ style }` }
				style={ align ? { textAlign: align } : null }
			>
				<Editable
					value={ value }
					onChange={
						( nextValue ) => setAttributes( {
							value: nextValue
						} )
					}
					focus={ focus && focus.editable === 'value' ? focus : null }
					onFocus={ () => setFocus( { editable: 'value' } ) }
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
							focus={ focus && focus.editable === 'citation' ? focus : null }
							onFocus={ () => setFocus( { editable: 'citation' } ) }
						/>
					</footer>
				) }
			</blockquote>
		);
	},

	save( attributes ) {
		const { align, value, citation, style = 1 } = attributes;

		return (
			<blockquote
				className={ `blocks-quote-style-${ style }` }
				style={ align ? { textAlign: align } : null }
			>
				{ value && value.map( ( paragraph, i ) => (
					<p key={ i }>{ paragraph }</p>
				) ) }
				<footer>{ citation }</footer>
			</blockquote>
		);
	}
} );
