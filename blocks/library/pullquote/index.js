/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query as hpq } from '../../api';
import Editable from '../../editable';

const { children, query } = hpq;

registerBlockType( 'core/pullquote', {

	title: __( 'Pullquote' ),

	icon: 'format-quote',

	category: 'formatting',

	attributes: {
		value: query( 'blockquote > p', children() ),
		citation: children( 'footer' ),
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { value, citation } = attributes;

		return (
			<blockquote className="blocks-pullquote">
				<Editable
					value={ value || __( 'Write Quote…' ) }
					onChange={
						( nextValue ) => setAttributes( {
							value: nextValue,
						} )
					}
					focus={ focus && focus.editable === 'value' ? focus : null }
					onFocus={ ( props ) => setFocus( { ...props, editable: 'value' } ) }
				/>
				{ ( citation || !! focus ) && (
					<Editable
						tagName="footer"
						value={ citation || __( 'Write caption…' ) }
						onChange={
							( nextCitation ) => setAttributes( {
								citation: nextCitation,
							} )
						}
						focus={ focus && focus.editable === 'citation' ? focus : null }
						onFocus={ ( props ) => setFocus( { ...props, editable: 'citation' } ) }
						inline
					/>
				) }
			</blockquote>
		);
	},

	save( { attributes } ) {
		const { value, citation } = attributes;

		return (
			<blockquote className="blocks-pullquote">
				{ value && value.map( ( paragraph, i ) => (
					<p key={ i }>{ paragraph }</p>
				) ) }

				{ citation && citation.length > 0 && (
					<footer>{ citation }</footer>
				) }
			</blockquote>
		);
	},
} );
