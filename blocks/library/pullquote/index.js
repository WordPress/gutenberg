/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from 'api';
import Editable from 'components/editable';

const { children, query, attr } = hpq;

registerBlock( 'core/pullquote', {
	title: wp.i18n.__( 'Pullquote' ),
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

			const match = value.match( /\bblocks-pullquote-style-(\d+)\b/ );
			if ( ! match ) {
				return;
			}

			return Number( match[ 1 ] );
		},
		bg: ( node ) => {
			const value = attr( 'blockquote', 'class' )( node );
			if ( ! value ) {
				return;
			}

			const match = value.match( /\bblocks-pullquote-bg-(\d+)\b/ );
			if ( ! match ) {
				return;
			}

			return Number( match[ 1 ] );
		},
	},

	controls: [
		...[ 1, 2 ].map( ( variation ) => ( {
			icon: 'format-quote',
			title: wp.i18n.sprintf( wp.i18n.__( 'Quote style %d' ), variation ),
			isActive: ( { style = 1 } ) => style === variation,
			onClick( attributes, setAttributes ) {
				setAttributes( { style: variation } );
			},
			subscript: variation
		} ) ),
		...[ 1, 2, 3 ].map( ( variation ) => ( {
			icon: 'art',
			title: wp.i18n.sprintf( wp.i18n.__( 'Background Color %d' ), variation ),
			onClick( attributes, setAttributes ) {
				setAttributes( { bg: variation } );
			},
			isActive: () => false,
			subscript: variation,
			classNames: [ `color${ variation }` ] // icon color
		} ) ),
	],

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { value, citation, style = 1, bg = 1 } = attributes;

		return (
			<blockquote className={ `blocks-pullquote blocks-pullquote-bg-${ bg } blocks-pullquote-style-${ style }` }>
				<Editable
					value={ value || 'Write Quote' }
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
							value={ citation || 'Write Citation' }
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

	save( { attributes } ) {
		const { value, citation, style = 1, bg = 1 } = attributes;

		return (
			<blockquote className={ `blocks-pullquote-style-${ style } blocks-pullquote-bg-${ bg }` }>
				{ value && wp.element.Children.map( value, ( paragraph, i ) => (
					<p key={ i }>{ paragraph }</p>
				) ) }
				<footer>{ citation }</footer>
			</blockquote>
		);
	}
} );
