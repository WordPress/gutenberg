/**
 * Internal dependencies
 */
import _LegacyCustomSelect from './legacy-component';
import _NewCustomSelect from './default-component';
import type { CustomSelectProps, LegacyCustomSelectProps } from './types';
import type { WordPressComponentProps } from '../context';

function isLegacy( props: any ): props is LegacyCustomSelectProps {
	return typeof props.options !== 'undefined';
}

function CustomSelect(
	props:
		| LegacyCustomSelectProps
		| WordPressComponentProps< CustomSelectProps, 'button', false >
) {
	if ( isLegacy( props ) ) {
		return <_LegacyCustomSelect { ...props } />;
	}

	return <_NewCustomSelect { ...props } />;
}

export default CustomSelect;
