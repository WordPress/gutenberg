/**
 * Internal dependencies
 */
import I18nLocale from './i18n-locale';

const i18n = new I18nLocale();

export const __ = i18n.__.bind( i18n );
export const _n = i18n._n.bind( i18n );
export const _nx = i18n._nx.bind( i18n );
export const _x = i18n._x.bind( i18n );
export const setLocaleData = i18n.setLocaleData.bind( i18n );
