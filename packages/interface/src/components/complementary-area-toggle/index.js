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
	name,
	...props
} ) {
	const ComponentToUse = as;
	const isSelected = useSelect(
		( select ) =>
			select( interfaceStore ).getActiveComplementaryArea( scope ) ===
			identifier,
		[ identifier, scope ]
	);
	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );
	return (
		<ComponentToUse
			icon={ selectedIcon && isSelected ? selectedIcon : icon }
			aria-controls={ identifier.replace( '/', ':' ) }
			onClick={ () => {
				if ( isSelected ) {
					disableComplementaryArea( scope );
				} else {
					enableComplementaryArea( scope, identifier );
				}
			} }
			{ ...props }
		/>
	);
}

export default complementaryAreaContext( ComplementaryAreaToggle );
