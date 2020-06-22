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
import complementaryAreaContext from '../complementary-area-context';

function ComplementaryAreaToggle( {
	as = Button,
	scope,
	identifier,
	icon,
	selectedIcon,
	...props
} ) {
	const ComponentToUse = as;
	const isSelected = useSelect(
		( select ) =>
			select( 'core/interface' ).getActiveComplementaryArea( scope ) ===
			identifier,
		[ identifier ]
	);
	const { enableComplementaryArea, disableComplementaryArea } = useDispatch(
		'core/interface'
	);
	return (
		<ComponentToUse
			icon={ selectedIcon && isSelected ? selectedIcon : icon }
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
