/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import ToolbarItem from '../toolbar-item';
import ToolbarButtonContainer from './toolbar-button-container';
import ToolbarContext from '../toolbar-context';

function ToolbarButton( {
	containerClassName,
	className,
	extraProps,
	children,
	...props
} ) {
	const accessibleToolbarState = useContext( ToolbarContext );

	if ( ! accessibleToolbarState ) {
		return (
			<ToolbarButtonContainer className={ containerClassName }>
				<Button
					icon={ props.icon }
					label={ props.title }
					shortcut={ props.shortcut }
					data-subscript={ props.subscript }
					onClick={ ( event ) => {
						event.stopPropagation();
						if ( props.onClick ) {
							props.onClick( event );
						}
					} }
					className={ classnames( 'components-toolbar__control', className ) }
					isPressed={ props.isActive }
					disabled={ props.isDisabled }
					{ ...extraProps }
				/>
				{ children }
			</ToolbarButtonContainer>
		);
	}

	return (
		<ToolbarItem
			className={ classnames( 'components-toolbar-button', className ) }
			{ ...props }
		>
			{ ( toolbarItemProps ) => <Button { ...toolbarItemProps }>{ children }</Button> }
		</ToolbarItem>
	);
}

export default ToolbarButton;
