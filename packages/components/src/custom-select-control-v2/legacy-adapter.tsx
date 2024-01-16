/**
 * Internal dependencies
 */
import CustomSelect from './custom-select';
import type { LegacyCustomSelectProps } from './types';
import { useDeprecatedProps } from './use-deprecated-props';

export function LegacyAdapter( props: LegacyCustomSelectProps ) {
	return (
		<CustomSelect
			{ ...useDeprecatedProps( props ) }
			hideLabelFromVision={ props.hideLabelFromVision }
		/>
	);
}
