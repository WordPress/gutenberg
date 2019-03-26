/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import IconButton from '../icon-button';
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
	return (
		<ToolbarButtonContainer className={ containerClassName }>
			<IconButton
				icon={ icon }
				label={ title }
				shortcut={ shortcut }
				data-subscript={ subscript }
				onClick={ ( event ) => {
					event.stopPropagation();
					onClick();
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
			{ children }
		</ToolbarButtonContainer>
	);
}

export default ToolbarButton;
