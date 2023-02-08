// @ts-nocheck

/**
 * External dependencies
 */
import classnames from 'classnames';
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

function ToolbarButton(
	{
		containerClassName,
		className,
		extraProps,
		children,
		title,
		isActive,
		isDisabled,
		...props
	},
	ref
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
					onClick={ ( event ) => {
						event.stopPropagation();
						if ( props.onClick ) {
							props.onClick( event );
						}
					} }
					className={ classnames(
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
			className={ classnames( 'components-toolbar-button', className ) }
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

export default forwardRef( ToolbarButton );
