/**
 * External dependencies
 */
import { find } from 'lodash';
/**
 * WordPress dependencies
 */
import TokenList from '@wordpress/token-list';
import { _x } from '@wordpress/i18n';

/**
 * Returns the active style from the given className.
 *
 * @param {Array}  styles    Block style variations.
 * @param {string} className Class name
 *
 * @return {Object?} The active style.
 */
export function getActiveStyle( styles, className ) {
	for ( const style of new TokenList( className ).values() ) {
		if ( style.indexOf( 'is-style-' ) === -1 ) {
			continue;
		}

		const potentialStyleName = style.substring( 9 );
		const activeStyle = find( styles, { name: potentialStyleName } );
		if ( activeStyle ) {
			return activeStyle;
		}
	}

	return find( styles, 'isDefault' );
}

/**
 * Replaces the active style in the block's className.
 *
 * @param {string}  className   Class name.
 * @param {Object?} activeStyle The replaced style.
 * @param {Object}  newStyle    The replacing style.
 *
 * @return {string} The updated className.
 */
export function replaceActiveStyle( className, activeStyle, newStyle ) {
	const list = new TokenList( className );

	if ( activeStyle ) {
		list.remove( 'is-style-' + activeStyle.name );
	}

	list.add( 'is-style-' + newStyle.name );

	return list.value;
}

/**
 * Returns a collection of styles that can be represented on the frontend.
 * The function checks a style collection for a default style. If none is found, it adds one to
 * act as a fallback for when there is no active style applied to a block. The default item also serves
 * as a switch on the frontend to deactivate non-default styles.
 *
 * @param {Array} styles Block style variations.
 *
 * @return {Array<Object?>}        The style collection.
 */
export function getRenderedStyles( styles ) {
	if ( ! styles || styles.length === 0 ) {
		return [];
	}

	return getDefaultStyle( styles )
		? styles
		: [
				{
					name: 'default',
					label: _x( 'Default', 'block style' ),
					isDefault: true,
				},
				...styles,
		  ];
}

/**
 * Returns a style object from a collection of styles where that style object is the default block style.
 *
 * @param {Array} styles Block style variations.
 *
 * @return {Object?}        The default style object, if found.
 */
export function getDefaultStyle( styles ) {
	return find( styles, 'isDefault' );
}
