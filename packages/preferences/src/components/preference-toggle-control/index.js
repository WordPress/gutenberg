/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as preferencesStore } from '../../store';
import PreferenceBaseOption from '../preference-base-option';

function PreferenceToggleControl( props ) {
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
			onChange={ onChange }
			isChecked={ isChecked }
			{ ...remainingProps }
		/>
	);
}

export default PreferenceToggleControl;
