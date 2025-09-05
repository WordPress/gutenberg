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
import type { ToolbarButtonOverriddenProps, ToolbarButtonProps } from './types';
import type { WordPressComponentProps } from '../../context';

function useDeprecatedProps( {
	isDisabled,
	...otherProps
}: React.ComponentProps< typeof ToolbarButton > ) {
	return {
		disabled: isDisabled,
		...otherProps,
	};
}

function UnforwardedToolbarButton(
	props: Omit<
		WordPressComponentProps< ToolbarButtonProps, typeof Button, false >,
		'accessibleWhenDisabled' // By default, ToolbarButton will be focusable when disabled.
	> &
		ToolbarButtonOverriddenProps,
	ref: ForwardedRef< any >
) {
	const {
		children,
		className,
		containerClassName,
		extraProps,
		isActive,
		title,
		...restProps
	} = useDeprecatedProps( props );
	const accessibleToolbarState = useContext( ToolbarContext );

	if ( ! accessibleToolbarState ) {
		return (
			<ToolbarButtonContainer className={ containerClassName }>
				<Button
					ref={ ref }
					icon={ restProps.icon }
					size="compact"
					label={ title }
					shortcut={ restProps.shortcut }
					data-subscript={ restProps.subscript }
					onClick={ (
						event: ReactMouseEvent<
							HTMLButtonElement & HTMLAnchorElement,
							MouseEvent
						>
					) => {
						event.stopPropagation();
						// TODO: Possible bug; maybe use onClick instead of restProps.onClick.
						if ( restProps.onClick ) {
							restProps.onClick( event );
						}
					} }
					className={ clsx(
						'components-toolbar__control',
						className
					) }
					isPressed={ isActive }
					accessibleWhenDisabled
					data-toolbar-item
					{ ...extraProps }
					{ ...restProps }
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
			{ ...restProps }
			ref={ ref }
		>
			{ ( toolbarItemProps ) => (
				<Button
					size="compact"
					label={ title }
					isPressed={ isActive }
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
