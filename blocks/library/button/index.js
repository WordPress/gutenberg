/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query } from 'api';
import Editable from 'components/editable';

const { attr, children } = query;

/**
 * Returns an attribute setter with behavior that if the target value is
 * already the assigned attribute value, it will be set to undefined.
 *
 * @param  {string}   align Alignment value
 * @return {Function}       Attribute setter
 */
function applyOrUnset( align ) {
	return ( attributes, setAttributes ) => {
		const nextAlign = attributes.align === align ? undefined : align;
		setAttributes( { align: nextAlign } );
	};
}

registerBlock( 'core/button', {
	title: wp.i18n.__( 'Button' ),

	icon: 'marker',

	category: 'common',

	attributes: {
		url: attr( 'a', 'href' ),
		title: attr( 'a', 'title' ),
		text: children( 'a' ),
		align: ( node ) => ( node.className.match( /\balign(\S+)/ ) || [] )[ 1 ]
	},

	controls: [
		{
			icon: 'align-left',
			title: wp.i18n.__( 'Align left' ),
			isActive: ( { align } ) => 'left' === align,
			onClick: applyOrUnset( 'left' )
		},
		{
			icon: 'align-center',
			title: wp.i18n.__( 'Align center' ),
			isActive: ( { align } ) => 'center' === align,
			onClick: applyOrUnset( 'center' )
		},
		{
			icon: 'align-right',
			title: wp.i18n.__( 'Align right' ),
			isActive: ( { align } ) => 'right' === align,
			onClick: applyOrUnset( 'right' )
		}
	],

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'center' === align ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { text, title } = attributes;

		return (
			<a className="blocks-button" title={ title }>
				<Editable
					tagName="span"
					placeholder={ wp.i18n.__( 'Write some text…' ) }
					value={ text }
					focus={ focus }
					onFocus={ setFocus }
					onChange={ ( value ) => setAttributes( { text: value } ) }
				/>
			</a>
		);
	},

	save( { attributes } ) {
		const { url, text, title, align = 'none' } = attributes;

		return (
			<div className={ `align${ align }` }>
				<a href={ url } title={ title }>
					{ text }
				</a>
			</div>
		);
	}
} );
