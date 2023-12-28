/**
 * Internal dependencies
 */
import ColorPicker from './component';
import type { LegacyAdapterProps } from './types';
import { useDeprecatedProps } from './use-deprecated-props';

export const LegacyAdapter = ( props: LegacyAdapterProps ) => {
	return <ColorPicker { ...useDeprecatedProps( props ) } />;
};
