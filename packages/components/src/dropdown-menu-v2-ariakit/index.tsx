/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	createContext,
	useContext,
	useMemo,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	StyledAriakitMenu,
	StyledAriakitMenuItem,
	toggleButton,
} from './styles';
import { useCx } from '../utils';

export const DropdownMenuContext = createContext<
	{ store: Ariakit.MenuStore } | undefined
>( undefined );

export interface DropdownMenuItemProps
	extends Omit< Ariakit.MenuItemProps, 'store' > {}

export const DropdownMenuItem = forwardRef<
	HTMLDivElement,
	DropdownMenuItemProps
>( function DropdownMenuItem( props, ref ) {
	const dropdownMenuContext = useContext( DropdownMenuContext );
	return (
		<StyledAriakitMenuItem
			ref={ ref }
			{ ...props }
			store={ dropdownMenuContext?.store }
		/>
	);
} );

export interface DropdownMenuProps extends Ariakit.MenuButtonProps {
	trigger: React.ReactNode;
	children?: React.ReactNode;
}

export const DropdownMenu = forwardRef< HTMLDivElement, DropdownMenuProps >(
	function DropdownMenu( { trigger, children, className, ...props }, ref ) {
		const parentContext = useContext( DropdownMenuContext );

		const dropdownMenuStore = Ariakit.useMenuStore( {
			parent: parentContext?.store,
		} );

		const cx = useCx();
		const menuButtonClassName = useMemo(
			() => cx( ! dropdownMenuStore.parent && toggleButton, className ),
			[ cx, dropdownMenuStore.parent, className ]
		);

		const contextValue = useMemo(
			() => ( { store: dropdownMenuStore } ),
			[ dropdownMenuStore ]
		);

		return (
			<>
				{ /* Menu trigger */ }
				<Ariakit.MenuButton
					ref={ ref }
					{ ...props }
					store={ dropdownMenuStore }
					className={ menuButtonClassName }
					render={
						dropdownMenuStore.parent ? (
							<DropdownMenuItem render={ props.render } />
						) : undefined
					}
				>
					{ trigger }
					<Ariakit.MenuButtonArrow />
				</Ariakit.MenuButton>

				{ /* Menu popover */ }
				<StyledAriakitMenu
					store={ dropdownMenuStore }
					gutter={ dropdownMenuStore.parent ? 16 : 8 }
					shift={ dropdownMenuStore.parent ? -9 : 0 }
					hideOnHoverOutside={ false }
					modal
				>
					<DropdownMenuContext.Provider value={ contextValue }>
						{ children }
					</DropdownMenuContext.Provider>
				</StyledAriakitMenu>
			</>
		);
	}
);
