/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ForwardedRef, MouseEvent as ReactMouseEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useContext, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../button';
import ToolbarItem from '../toolbar-item';
import ToolbarContext from '../toolbar-context';
import ToolbarButtonContainer from './toolbar-button-container';
import type { ToolbarButtonProps } from './types';
import type { WordPressComponentProps } from '../../context';

function UnforwardedToolbarButton(
	{
		children,
		className,
		containerClassName,
		extraProps,
		isActive,
		isDisabled,
		title,
		...props
	}: WordPressComponentProps< ToolbarButtonProps, typeof Button, false >,
	ref: ForwardedRef< any >
) {
	const accessibleToolbarState = useContext( ToolbarContext );

	if ( ! accessibleToolbarState ) {
		return (
			<ToolbarButtonContainer className={ containerClassName }>
				<Button
					ref={ ref }
					icon={ props.icon }
					label={ title }
					shortcut={ props.shortcut }
					data-subscript={ props.subscript }
					onClick={ (
						event: ReactMouseEvent<
							HTMLButtonElement & HTMLAnchorElement,
							MouseEvent
						>
					) => {
						event.stopPropagation();
						// TODO: Possible bug; maybe use onClick instead of props.onClick.
						if ( props.onClick ) {
							props.onClick( event );
						}
					} }
					className={ clsx(
						'components-toolbar__control',
						className
					) }
					isPressed={ isActive }
					disabled={ isDisabled }
					data-toolbar-item
					{ ...extraProps }
					{ ...props }
				>
					{ children }
				</Button>
			</ToolbarButtonContainer>
		);
	}

	// ToobarItem will pass all props to the render prop child, which will pass
	// all props to Button. This means that ToolbarButton has the same API as
	// Button.
	return (
		<ToolbarItem
			className={ clsx( 'components-toolbar-button', className ) }
			{ ...extraProps }
			{ ...props }
			ref={ ref }
		>
			{ ( toolbarItemProps ) => (
				<Button
					label={ title }
					isPressed={ isActive }
					disabled={ isDisabled }
					{ ...toolbarItemProps }
				>
					{ children }
				</Button>
			) }
		</ToolbarItem>
	);
}

/**
 * ToolbarButton can be used to add actions to a toolbar, usually inside a Toolbar
 * or ToolbarGroup when used to create general interfaces.
 *
 * ```jsx
 * import { Toolbar, ToolbarButton } from '@wordpress/components';
 * import { edit } from '@wordpress/icons';
 *
 * function MyToolbar() {
 *   return (
 *		<Toolbar label="Options">
 *			<ToolbarButton
 *				icon={ edit }
 *				label="Edit"
 *				onClick={ () => alert( 'Editing' ) }
 *			/>
 *		</Toolbar>
 *   );
 * }
 * ```
 */
export const ToolbarButton = forwardRef( UnforwardedToolbarButton );
export default ToolbarButton;
