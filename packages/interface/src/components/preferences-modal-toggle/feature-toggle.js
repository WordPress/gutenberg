/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PreferencesModalToggle from '../preferences-modal-toggle';
import { store as interfaceStore } from '../../store';

export default function PreferencesModalFeatureToggle( {
	scope,
	feature,
	...props
} ) {
	const isChecked = useSelect(
		( select ) =>
			select( interfaceStore ).isFeatureActive( scope, feature ),
		[ scope, feature ]
	);
	const { toggleFeature } = useDispatch( interfaceStore );

	return (
		<PreferencesModalToggle
			{ ...props }
			isChecked={ isChecked }
			onChange={ () => {
				toggleFeature( scope, feature );
			} }
		/>
	);
}
