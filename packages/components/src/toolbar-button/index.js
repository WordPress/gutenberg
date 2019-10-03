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
import ToolbarContext from '../toolbar-context';
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
	// It'll contain state if `ToolbarButton` is being used within
	// `<Toolbar __experimentalAccessibilityLabel="label" />`
	const accessibleToolbarState = useContext( ToolbarContext );

	const button = (
		<IconButton
			icon={ icon }
			label={ title }
			shortcut={ shortcut }
			data-subscript={ subscript }
			onClick={ ( event ) => {
				event.stopPropagation();
				if ( onClick ) {
					onClick( event );
				}
			} }
			className={ classnames(
				'components-toolbar__control',
				className,
				{ 'is-active': isActive }
			) }
			isToggled={ isActive }
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

	// ToolbarButton is being used outside of the accessible Toolbar
	return (
		<ToolbarButtonContainer className={ containerClassName }>
			{ button }
			{ children }
		</ToolbarButtonContainer>
	);
}

export default ToolbarButton;
