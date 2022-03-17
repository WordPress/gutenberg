/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { ___unstablePreferencesModalBaseOption as BaseOption } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';

export default function EnableFeature( props ) {
	const { featureName, ...remainingProps } = props;
	const isChecked = useSelect( ( select ) =>
		select( preferencesStore ).get( 'core/edit-site', featureName )
	);
	const { toggle } = useDispatch( preferencesStore );
	const onChange = () => toggle( 'core/edit-site', featureName );
	return (
		<BaseOption
			onChange={ onChange }
			isChecked={ isChecked }
			{ ...remainingProps }
		/>
	);
}
