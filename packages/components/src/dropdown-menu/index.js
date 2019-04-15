/**
 * External dependencies
 */
import classnames from 'classnames';
import { flatMap, isEmpty, isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { DOWN } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import DropdownMenuSeparator from './separator';
import IconButton from '../icon-button';
import Dropdown from '../dropdown';
import { NavigableMenu } from '../navigable-container';

function DropdownMenu( {
	children,
	className,
	controls,
	icon = 'menu',
	label,
	labelPosition,
	menuClassName,
	menuLabel,
	position,
	popoverClassName,
	toggleClassName,
} ) {
	if ( isEmpty( controls ) && ! isFunction( children ) ) {
		return null;
	}

	// Normalize controls to nested array of objects (sets of controls)
	let controlSets;
	if ( ! isEmpty( controls ) ) {
		controlSets = controls;
		if ( ! Array.isArray( controlSets[ 0 ] ) ) {
			controlSets = [ controlSets ];
		}
	}

	return (
		<Dropdown
			className={ classnames( 'components-dropdown-menu', className ) }
			contentClassName={ classnames( 'components-dropdown-menu__popover', popoverClassName ) }
			position={ position }
			renderToggle={ ( { isOpen, onToggle } ) => {
				const openOnArrowDown = ( event ) => {
					if ( ! isOpen && event.keyCode === DOWN ) {
						event.preventDefault();
						event.stopPropagation();
						onToggle();
					}
				};

				return (
					<IconButton
						className={ classnames( 'components-dropdown-menu__toggle', toggleClassName, {
							'is-opened': isOpen,
						} ) }
						icon={ icon }
						onClick={ onToggle }
						onKeyDown={ openOnArrowDown }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						label={ label }
						labelPosition={ labelPosition }
						tooltip={ label }
					>
						{ icon !== 'ellipsis' && <span className="components-dropdown-menu__indicator" /> }
					</IconButton>
				);
			} }
			renderContent={ ( props ) => {
				return (
					<NavigableMenu
						className={ classnames( 'components-dropdown-menu__menu', menuClassName ) }
						role="menu"
						aria-label={ menuLabel }
					>
						{
							isFunction( children ) ?
								children( props ) :
								null
						}
						{ flatMap( controlSets, ( controlSet, indexOfSet ) => (
							controlSet.map( ( control, indexOfControl ) => (
								<IconButton
									key={ [ indexOfSet, indexOfControl ].join() }
									onClick={ ( event ) => {
										event.stopPropagation();
										props.onClose();
										if ( control.onClick ) {
											control.onClick();
										}
									} }
									className={ classnames(
										'components-dropdown-menu__menu-item',
										{
											'has-separator': indexOfSet > 0 && indexOfControl === 0,
											'is-active': control.isActive,
										},
									) }
									icon={ control.icon }
									role="menuitem"
									disabled={ control.isDisabled }
								>
									{ control.title }
								</IconButton>
							) )
						) ) }
					</NavigableMenu>
				);
			} }
		/>
	);
}

export { DropdownMenuSeparator };

export default DropdownMenu;
