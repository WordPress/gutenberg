/**
 * WordPress dependencies
 */
import { createExperiments } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import './hooks';
export {
	PresetDuotoneFilter as __unstablePresetDuotoneFilter,
	getBorderClassesAndStyles as __experimentalGetBorderClassesAndStyles,
	useBorderProps as __experimentalUseBorderProps,
	getColorClassesAndStyles as __experimentalGetColorClassesAndStyles,
	useColorProps as __experimentalUseColorProps,
	useCustomSides as __experimentalUseCustomSides,
	getSpacingClassesAndStyles as __experimentalGetSpacingClassesAndStyles,
	useCachedTruthy,
} from './hooks';
export * from './components';
export * from './elements';
export * from './utils';
export { storeConfig, store } from './store';
export { SETTINGS_DEFAULTS } from './store/defaults';

const __experiments = createExperiments( {
	test( name ) {
		// eslint-disable-next-line no-console
		console.log( `Executed with "${ name }".` );
	},
} );

export { __experiments };
