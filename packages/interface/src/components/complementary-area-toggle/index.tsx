import type { AriaRole, MouseEvent } from 'react';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { usePluginContext } from '@wordpress/plugins';
import { store as interfaceStore } from '../../store';
import type { ComplementaryAreaToggleProps } from './types';

/**
 * Whether the role supports checked state.
 *
 * @see https://www.w3.org/TR/wai-aria-1.1/#aria-checked
 * @param role Role.
 * @return Whether the role supports checked state.
 */
function roleSupportsCheckedState( role?: AriaRole ): boolean {
	return [
		'checkbox',
		'option',
		'radio',
		'switch',
		'menuitemcheckbox',
		'menuitemradio',
		'treeitem',
	].includes( role as string );
}

export default function ComplementaryAreaToggle( {
	as = Button,
	scope,
	identifier: identifierProp,
	icon: iconProp,
	selectedIcon,
	name,
	shortcut,
	'data-wp-complementary-area': isDefaultMenuItem,
	...props
}: ComplementaryAreaToggleProps ) {
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
			data-wp-complementary-area={
				isDefaultMenuItem ? identifier : undefined
			}
			{ ...( props.role === 'menuitemradio' && { value: identifier } ) }
			onClick={ ( event?: MouseEvent< HTMLElement > ) => {
				// The host menu can present a default panel toggle as a radio.
				const role =
					event?.currentTarget?.getAttribute( 'role' ) ?? props.role;
				if ( isSelected ) {
					if ( role !== 'menuitemradio' ) {
						disableComplementaryArea( scope );
					}
				} else {
					enableComplementaryArea( scope, identifier );
				}
			} }
			shortcut={ shortcut }
			{ ...props }
		/>
	);
}
