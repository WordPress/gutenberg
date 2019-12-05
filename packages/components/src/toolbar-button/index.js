/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import IconButton from '../icon-button';
import ToolbarButtonContainer from './toolbar-button-container';
import Button from '../button';
import ToolbarItem from '../toolbar-item';

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
	...props
} ) {
	if ( icon ) {
		return (
			<ToolbarButtonContainer className={ containerClassName }>
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
					className={ classnames( 'components-toolbar__control', className, {
						'is-active': isActive,
					} ) }
					aria-pressed={ isActive }
					disabled={ isDisabled }
					{ ...extraProps }
				/>
				{ children }
			</ToolbarButtonContainer>
		);
	}

	return (
		<ToolbarItem
			onClick={ onClick }
			className={ classnames( 'components-toolbar-button', className ) }
			{ ...props }
		>
			{ ( toolbarItemProps ) => <Button { ...toolbarItemProps }>{ children }</Button> }
		</ToolbarItem>
	);
}

export default ToolbarButton;
