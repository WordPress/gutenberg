/**
 * External dependencies
 */
import { camelCase, upperFirst } from 'lodash';

/**
 * Internal dependencies
 */
import modelsConfig from './models';
import { getModelRecord } from './selectors';

export default modelsConfig.reduce( ( memo, { kind, name } ) => {
	const kindPrefix = kind === 'root' ? '' : upperFirst( camelCase( kind ) );
	const nameSuffix = upperFirst( camelCase( name ) );
	return {
		...memo,
		[ `get${ kindPrefix }${ nameSuffix }` ]: ( state, primaryKey ) => getModelRecord( state, kind, name, primaryKey ),
	};
}, {} );
