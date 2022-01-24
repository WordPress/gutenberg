/**
 * Internal dependencies
 */
import useSetting from '../use-setting';

export default function useCommonSingleMultipleSelects() {
	return {
		disableCustomColors: ! useSetting( 'color.custom' ),
		disableCustomGradients: ! useSetting( 'color.customGradient' ),
	};
}
