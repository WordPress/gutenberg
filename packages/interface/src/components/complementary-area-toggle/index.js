/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { usePluginContext } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import { store as interfaceStore } from '../../store';

/**
 * Whether the role supports checked state.
 *
 * @param {import('react').AriaRole} role Role.
 * @return {boolean} Whether the role supports checked state.
 * @see https://www.w3.org/TR/wai-aria-1.1/#aria-checked
 */
function roleSupportsCheckedState( role ) {
	return [
		'checkbox',
		'option',
		'radio',
		'switch',
		'menuitemcheckbox',
		'menuitemradio',
		'treeitem',
	].includes( role );
}

export default function ComplementaryAreaToggle( {
	as = Button,
	scope,
	identifier: identifierProp,
	icon: iconProp,
	selectedIcon,
	name,
	shortcut,
	...props
} ) {
	const ComponentToUse = as;
	const context = usePluginContext();
	const icon = iconProp || context.icon;
	const identifier = identifierProp || `${ context.name }/${ name }`;
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
			// Make sure aria-checked matches spec https://www.w3.org/TR/wai-aria-1.1/#aria-checked
			aria-checked={
				roleSupportsCheckedState( props.role ) ? isSelected : undefined
			}
			onClick={ () => {
				if ( isSelected ) {
					disableComplementaryArea( scope );
				} else {
					enableComplementaryArea( scope, identifier );
				}
			} }
			shortcut={ shortcut }
			{ ...props }
		/>
	);
}
