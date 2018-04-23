/**
 * Internal dependencies
 */
import './style.scss';
import blockAutocompleter from './block';
import userAutocompleter from './user';

export const defaultAutocompleters = [ userAutocompleter ];
export { blockAutocompleter, userAutocompleter };
