/**
 * External dependencies
 */
import { find, sortBy } from 'lodash';
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
 * Returns a sorted collection of styles that can be represented on the frontend.
 * The function checks a style collection for a default style. If none is found, it adds one to
 * act as a fallback for when there is no active style applied to a block. The default item also serves
 * as a switch on the frontend to deactivate non-default styles.
 *
 * If there is a default selected, we move that to the start of the array.
 *
 * @param {Array}           styles            Block style variations.
 * @param {string}          defaultStyleId    The currently-selected default style.
 *
 * @return {Array<Object?>}                   The style collection.
 */
export function getRenderedStyles( styles, defaultStyleId ) {
	if ( ! styles ) {
		return [];
	}

	const renderedStyles = find( styles, 'isDefault' )
		? styles
		: [
				{
					name: 'default',
					label: _x( 'Default', 'block style' ),
					isDefault: true,
				},
				...styles,
		  ];

	if ( defaultStyleId ) {
		return sortBy(
			renderedStyles,
			( style ) => style.name !== defaultStyleId
		);
	}

	return renderedStyles;
}
