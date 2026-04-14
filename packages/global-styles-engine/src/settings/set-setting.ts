/**
 * Internal dependencies
 */
import { setImmutably } from '../utils/object';
import type { GlobalStylesConfig } from '../types';

export function setSetting< T = any >(
	globalStyles: GlobalStylesConfig,
	path: string,
	newValue: T | undefined,
	blockName?: string
): GlobalStylesConfig {
	const appendedBlockPath = blockName ? '.blocks.' + blockName : '';
	const appendedPropertyPath = path ? '.' + path : '';
	const finalPath = `settings${ appendedBlockPath }${ appendedPropertyPath }`;

	return setImmutably(
		globalStyles,
		finalPath.split( '.' ),
		newValue
	) as GlobalStylesConfig;
}
