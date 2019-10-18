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
import IconButton from '../icon-button';
import { __unstableToolbarContext } from '../toolbar';
import AccessibleToolbarButtonContainer from './accessible-toolbar-button-container';
import ToolbarButtonContainer from './toolbar-button-container';

function ToolbarButton( {
	containerClassName,
	icon,
	title,
	shortcut,
	subscript,
	onClick,
	className,
	isActive,
	isDisabled,
	extraProps,
	children,
} ) {
	const accessibleToolbarState = useContext( __unstableToolbarContext );

	const button = (
		<IconButton
			icon={ icon }
			label={ title }
			shortcut={ shortcut }
			data-subscript={ subscript }
			onClick={ ( event ) => {
				event.stopPropagation();
				onClick( event );
			} }
			className={ classnames(
				'components-toolbar__control',
				className,
				{ 'is-active': isActive }
			) }
			aria-pressed={ isActive }
			disabled={ isDisabled }
			{ ...extraProps }
		/>
	);

	if ( accessibleToolbarState ) {
		return (
			<AccessibleToolbarButtonContainer className={ containerClassName }>
				{ button }
			</AccessibleToolbarButtonContainer>
		);
	}

	return (
		<ToolbarButtonContainer className={ containerClassName }>
			{ button }
			{ children }
		</ToolbarButtonContainer>
	);
}

export default ToolbarButton;
