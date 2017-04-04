/**
 * External dependencies
 */
import Jed from 'jed';

let i18n;

export function setLocaleData( data ) {
	i18n = new Jed( data );
}

export function getI18n() {
	if ( ! i18n ) {
		setLocaleData( { '': {} } );
	}

	return i18n;
}

export function __( string ) {
	return getI18n().gettext( string );
}

export function _x( string, context ) {
	return getI18n().pgettext( context, string );
}

export function _n( single, plural, number ) {
	return getI18n().ngettext( single, plural, number );
}

export function _nx( single, plural, number, context ) {
	return getI18n().npgettext( context, single, plural, number );
}

export const sprintf = Jed.sprintf;
