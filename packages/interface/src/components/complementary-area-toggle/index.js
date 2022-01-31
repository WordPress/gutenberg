/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as interfaceStore } from '../../store';
import complementaryAreaContext from '../complementary-area-context';

function ComplementaryAreaToggle( {
	as = Button,
	scope,
	identifier,
	icon,
	selectedIcon,
	hideToggleToScreenReader,
	...props
} ) {
	const ComponentToUse = as;
	const isSelected = useSelect(
		( select ) =>
			select( interfaceStore ).getActiveComplementaryArea( scope ) ===
			identifier,
		[ identifier ]
	);
	const { enableComplementaryArea, disableComplementaryArea } = useDispatch(
		interfaceStore
	);
	return (
		<ComponentToUse
			icon={ selectedIcon && isSelected ? selectedIcon : icon }
			aria-hidden={ hideToggleToScreenReader }
			onClick={ () => {
				if ( isSelected ) {
					disableComplementaryArea( scope );
				} else {
					enableComplementaryArea( scope, identifier );
				}
			} }
			{ ...omit( props, [ 'name' ] ) }
		/>
	);
}

export default complementaryAreaContext( ComplementaryAreaToggle );
