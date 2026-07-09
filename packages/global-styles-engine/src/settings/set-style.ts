/**
 * Internal dependencies
 */
import { setImmutably } from '../utils/object';
import type { GlobalStylesConfig } from '../types';
import { normalizeStyleStateAliases } from '../style-state-back-compat';

export function setStyle< T = any >(
	globalStyles: GlobalStylesConfig,
	path: string,
	newValue: T | undefined,
	blockName?: string
): GlobalStylesConfig {
	const appendedPath = path ? '.' + path : '';
	const finalPath = ! blockName
		? `styles${ appendedPath }`
		: `styles.blocks.${ blockName }${ appendedPath }`;

	return setImmutably(
		normalizeStyleStateAliases( globalStyles ),
		finalPath.split( '.' ),
		newValue
	) as GlobalStylesConfig;
}
