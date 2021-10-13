/**
 * Internal dependencies
 */
import ColorPicker from './component';
import { useDeprecatedProps } from './use-deprecated-props';

type LegacyAdapterProps = Parameters< typeof useDeprecatedProps >[ 0 ];

export const LegacyAdapter = ( props: LegacyAdapterProps ) => {
	return <ColorPicker { ...useDeprecatedProps( props ) } />;
};
