/**
 * WordPress dependencies
 */
import Button from 'components/button';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query } from '../../api';
import Editable from '../../editable';
import Dashicon from 'components/dashicon';

const { attr, text } = query;

/**
 * Returns an attribute setter with behavior that if the target value is
 * already the assigned attribute value, it will be set to undefined.
 *
 * @param  {string}   align Alignment value
 * @return {Function}       Attribute setter
 */
function toggleAlignment( align ) {
	return ( attributes, setAttributes ) => {
		const nextAlign = attributes.align === align ? undefined : align;
		setAttributes( { align: nextAlign } );
	};
}

registerBlock( 'core/cover-image', {
	title: wp.i18n.__( 'Cover Image' ),

	icon: 'format-image',

	category: 'common',

	attributes: {
		url: attr( 'section', 'data-url' ),
		title: text( 'h2' ),
	},

	controls: [
		{
			icon: 'format-image',
			title: wp.i18n.__( 'Change Image' ),
			isActive: ( { align } ) => 'left' === align,
			onClick: toggleAlignment( 'left' ),
		},
		{
			icon: 'align-left',
			title: wp.i18n.__( 'Align left' ),
			isActive: ( { align } ) => 'left' === align,
			onClick: toggleAlignment( 'left' ),
		},
		{
			icon: 'align-center',
			title: wp.i18n.__( 'Align center' ),
			isActive: ( { align } ) => 'center' === align,
			onClick: toggleAlignment( 'center' ),
		},
		{
			icon: 'align-right',
			title: wp.i18n.__( 'Align right' ),
			isActive: ( { align } ) => 'right' === align,
			onClick: toggleAlignment( 'right' ),
		},
		{
			icon: 'align-full-width',
			title: wp.i18n.__( 'Wide width' ),
			isActive: ( { align } ) => 'wide' === align,
			onClick: toggleAlignment( 'wide' ),
		},
	],

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { url, title } = attributes;

		if ( ! url ) {
			return (
				<div className="blocks-image is-placeholder">
					<div className="blocks-image__placeholder-label">
						<Dashicon icon="format-image" />
						{ wp.i18n.__( 'Cover Image' ) }
					</div>
					<div className="blocks-image__placeholder-instructions">
						{ wp.i18n.__( 'Drag image here or insert from media library' ) }
					</div>
					<Button isLarge>
						{ wp.i18n.__( 'Insert from Media Library' ) }
					</Button>
				</div>
			);
		}

		const style = {
			backgroundImage: `url(${ url })`,
		};

		return (
			<section className="blocks-cover-image">
				<section className="cover-image" data-url={ url } style={ style }>
					{ title || !! focus ? (
						<Editable
							tagName="h2"
							placeholder={ wp.i18n.__( 'Write title' ) }
							value={ title }
							focus={ focus }
							onFocus={ setFocus }
							onChange={ ( value ) => setAttributes( { title: value } ) } />
					) : null }
				</section>
			</section>
		);
	},

	save( { attributes } ) {
		const { url, title } = attributes;
		const style = {
			backgroundImage: `url(${ url })`,
		};

		return (
			<section className="cover-image" data-url={ url } style={ style }>
				<h2>{ title }</h2>
			</section>
		);
	},
} );
