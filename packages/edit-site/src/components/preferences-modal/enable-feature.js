/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { ___unstablePreferencesModalBaseOption as BaseOption } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';

export default function EnableFeature( props ) {
	const { featureName, onToggle = () => {}, ...remainingProps } = props;
	const isChecked = useSelect(
		( select ) =>
			!! select( preferencesStore ).get( 'core/edit-site', featureName ),
		[ featureName ]
	);
	const { toggle } = useDispatch( preferencesStore );
	const onChange = () => {
		onToggle();
		toggle( 'core/edit-site', featureName );
	};
	return (
		<BaseOption
			onChange={ onChange }
			isChecked={ isChecked }
			{ ...remainingProps }
		/>
	);
}
