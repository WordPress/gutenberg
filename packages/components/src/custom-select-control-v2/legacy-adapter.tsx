/**
 * Internal dependencies
 */
import _LegacyCustomSelect from './legacy-component';
import _NewCustomSelect from './default-component';
import type { CustomSelectProps, LegacyCustomSelectProps } from './types';

export function isLegacy( props: any ): props is LegacyCustomSelectProps {
	return typeof props.options !== 'undefined';
}

export function DefaultExport(
	props: LegacyCustomSelectProps | CustomSelectProps
) {
	if ( isLegacy( props ) ) {
		return <_LegacyCustomSelect { ...props } />;
	}

	return <_NewCustomSelect { ...props } />;
}
