/**
 * Internal dependencies
 */
import { getValueFromObjectPath } from '../utils/object';
import { getValueFromVariable } from '../utils/common';
import type { GlobalStylesConfig, UnresolvedValue } from '../types';

export function getStyle< T = any >(
	globalStyles?: GlobalStylesConfig,
	path?: string,
	blockName?: string,
	shouldDecodeEncode = true
): T | undefined {
	const appendedPath = path ? '.' + path : '';
	const finalPath = ! blockName
		? `styles${ appendedPath }`
		: `styles.blocks.${ blockName }${ appendedPath }`;
	if ( ! globalStyles ) {
		return undefined;
	}

	const rawResult = getValueFromObjectPath( globalStyles, finalPath ) as
		| string
		| UnresolvedValue;
	const result = shouldDecodeEncode
		? getValueFromVariable( globalStyles, blockName, rawResult )
		: rawResult;
	return result as T | undefined;
}
