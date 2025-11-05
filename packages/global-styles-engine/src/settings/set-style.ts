/**
 * Internal dependencies
 */
import { setImmutably } from '../utils/object';
import type { GlobalStylesConfig } from '../types';

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
		globalStyles,
		finalPath.split( '.' ),
		newValue
	) as GlobalStylesConfig;
}
