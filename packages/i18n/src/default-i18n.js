/**
 * Internal dependencies
 */
import { I18n } from './i18n';

export const i18n = new I18n();
export const setLocaleData = i18n.setLocaleData.bind( i18n );
export const __ = i18n.__.bind( i18n );
export const _x = i18n._x.bind( i18n );
export const _n = i18n._n.bind( i18n );
export const _nx = i18n._nx.bind( i18n );
export const isRTL = i18n.isRTL.bind( i18n );
