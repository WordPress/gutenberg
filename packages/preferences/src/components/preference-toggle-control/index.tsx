/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as preferencesStore } from '../../store';
import type { BaseOptionProps } from '../preference-base-option/types';
import PreferenceBaseOption from '../preference-base-option';

export type PreferenceToggleControlProps = {
	scope: string;
	featureName: string;
	onToggle: () => void;
} & Omit< BaseOptionProps, 'onChange' | 'isChecked' >;

function PreferenceToggleControl( props: PreferenceToggleControlProps ) {
	const {
		scope,
		featureName,
		onToggle = () => {},
		...remainingProps
	} = props;
	const isChecked = useSelect(
		( select ) => !! select( preferencesStore ).get( scope, featureName ),
		[ scope, featureName ]
	);
	const { toggle } = useDispatch( preferencesStore );
	const onChange = () => {
		onToggle();
		toggle( scope, featureName );
	};

	return (
		<PreferenceBaseOption
			{ ...remainingProps }
			onChange={ onChange }
			isChecked={ isChecked }
		/>
	);
}

export default PreferenceToggleControl;
