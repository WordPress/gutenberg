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
import { ToolbarContext } from '../toolbar';
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
	...rest
} ) {
	// It'll contain state if `ToolbarButton` is being used within
	// `<Toolbar accessibilityLabel="label" />`
	const accessibleToolbarState = useContext( ToolbarContext );

	const renderButton = ( otherProps ) => (
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
			aria-pressed={ isActive }
			disabled={ isDisabled }
			// With this attribute, can check if `ToolbarButton` is used within the
			// tree and then decide whether to use the accessible Toolbar (which only
			// accepts `ToolbarButton` as toolbar items) or fallback to the legacy
			// `NavigableToolbar`
			data-toolbar-button={ true }
			{ ...extraProps }
			{ ...otherProps }
		/>
	);

	if ( accessibleToolbarState ) {
		return (
			<AccessibleToolbarButtonContainer className={ containerClassName }>
				{ renderButton( rest ) }
			</AccessibleToolbarButtonContainer>
		);
	}

	// ToolbarButton is being used outside of the accessible Toolbar
	return (
		<ToolbarButtonContainer className={ containerClassName }>
			{ renderButton() }
			{ children }
		</ToolbarButtonContainer>
	);
}

export default ToolbarButton;
