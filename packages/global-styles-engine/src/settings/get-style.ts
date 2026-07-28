/**
 * Internal dependencies
 */
import { getValueFromObjectPath } from '../utils/object';
import { getValueFromVariable } from '../utils/common';
import type { GlobalStylesConfig, UnresolvedValue } from '../types';
import { getLegacyStyleStatePath } from '../style-state-back-compat';

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

	let rawResult = getValueFromObjectPath( globalStyles, finalPath ) as
		| string
		| UnresolvedValue;
	const legacyPath = getLegacyStyleStatePath( finalPath );
	if ( rawResult === undefined && legacyPath ) {
		let hasCanonicalPath = true;
		let currentValue: any = globalStyles;
		for ( const pathPart of finalPath.split( '.' ) ) {
			if (
				! currentValue ||
				typeof currentValue !== 'object' ||
				! Object.hasOwn( currentValue, pathPart )
			) {
				hasCanonicalPath = false;
				break;
			}
			currentValue = currentValue[ pathPart ];
		}
		if ( ! hasCanonicalPath ) {
			rawResult = getValueFromObjectPath( globalStyles, legacyPath ) as
				| string
				| UnresolvedValue;
		}
	}
	const result = shouldDecodeEncode
		? getValueFromVariable( globalStyles, blockName, rawResult )
		: rawResult;
	return result as T | undefined;
}
