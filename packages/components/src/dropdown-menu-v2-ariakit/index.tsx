/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	StyledAriakitMenu,
	StyledAriakitMenuItem,
	toggleButton,
} from './styles';
import { useCx } from '../utils';

export interface DropdownMenuItemProps extends Ariakit.MenuItemProps {}

export const DropdownMenuItem = forwardRef<
	HTMLDivElement,
	DropdownMenuItemProps
>( function DropdownMenuItem( props, ref ) {
	const store = Ariakit.useMenuContext();
	return <StyledAriakitMenuItem ref={ ref } store={ store } { ...props } />;
} );

export interface DropdownMenuProps extends Ariakit.MenuButtonProps {
	trigger: React.ReactNode;
}

export const DropdownMenu = forwardRef< HTMLDivElement, DropdownMenuProps >(
	function DropdownMenu( { trigger, children, ...props }, ref ) {
		const cx = useCx();
		const menu = Ariakit.useMenuStore();

		const menuButtonClassName = cx(
			! menu.parent && toggleButton,
			props.className
		);

		return (
			<Ariakit.MenuProvider store={ menu }>
				<Ariakit.MenuButton
					ref={ ref }
					{ ...props }
					className={ menuButtonClassName }
					render={
						menu.parent ? (
							<DropdownMenuItem render={ props.render } />
						) : undefined
					}
				>
					{ trigger }
					<Ariakit.MenuButtonArrow />
				</Ariakit.MenuButton>
				<StyledAriakitMenu
					gutter={ 8 }
					shift={ menu.parent ? -9 : 0 }
					modal
				>
					{ children }
				</StyledAriakitMenu>
			</Ariakit.MenuProvider>
		);
	}
);
