/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query } from 'api';
import Editable from 'components/editable';
import IconButton from '../../../editor/components/icon-button';

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

	category: 'layout',

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
		const { text, url, title } = attributes;

		return (
			<span className="blocks-button" title={ title }>
				<Editable
					tagName="span"
					placeholder={ wp.i18n.__( 'Write some text…' ) }
					value={ text }
					onFocus={ setFocus }
					onChange={ ( value ) => setAttributes( { text: value } ) }
				/>
				{ focus &&
					<form
						className="editable-format-toolbar__link-modal"
						onSubmit={ ( event ) => event.preventDefault() }>
						<input
							className="editable-format-toolbar__link-input"
							type="url"
							required
							value={ url }
							onChange={ ( event ) => setAttributes( { url: event.target.value } ) }
							placeholder={ wp.i18n.__( 'Paste URL or type' ) }
						/>
						<IconButton icon="editor-break" type="submit" />
					</form>
				}
			</span>
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
