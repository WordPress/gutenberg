/**
 * External dependencies
 */
import classnames from 'classnames';
import { flatMap, isEmpty, isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { DOWN } from '@wordpress/keycodes';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import IconButton from '../icon-button';
import Dropdown from '../dropdown';
import { NavigableMenu } from '../navigable-container';

function mergeProps( props = {}, defaultProps = {} ) {
	const mergedProps = {
		...defaultProps,
		...props,
	};

	if ( props.className && defaultProps.className ) {
		mergedProps.className = classnames( props.className, defaultProps.className );
	}

	return mergedProps;
}

function DropdownMenu( {
	children,
	className,
	controls,
	hasArrowIndicator = false,
	icon = 'menu',
	label,
	popoverProps,
	toggleProps,
	menuProps,
	// The following props exist for backward compatibility.
	menuLabel,
	position,
} ) {
	if ( menuLabel ) {
		deprecated( '`menuLabel` prop in `DropdownComponent`', {
			alternative: '`menuProps` object and its `aria-label` property',
			plugin: 'Gutenberg',
		} );
	}

	if ( position ) {
		deprecated( '`position` prop in `DropdownComponent`', {
			alternative: '`popoverProps` object and its `position` property',
			plugin: 'Gutenberg',
		} );
	}

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
	const mergedPopoverProps = mergeProps( popoverProps, {
		className: 'components-dropdown-menu__popover',
		position,
	} );

	return (
		<Dropdown
			className={ classnames( 'components-dropdown-menu', className ) }
			popoverProps={ mergedPopoverProps }
			renderToggle={ ( { isOpen, onToggle } ) => {
				const openOnArrowDown = ( event ) => {
					if ( ! isOpen && event.keyCode === DOWN ) {
						event.preventDefault();
						event.stopPropagation();
						onToggle();
					}
				};
				const mergedToggleProps = mergeProps( toggleProps, {
					className: classnames( 'components-dropdown-menu__toggle', {
						'is-opened': isOpen,
					} ),
					tooltip: label,
				} );

				return (
					<IconButton
						{ ...mergedToggleProps }
						icon={ icon }
						onClick={ onToggle }
						onKeyDown={ openOnArrowDown }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						label={ label }
					>
						{ ( ! icon || hasArrowIndicator ) && <span className="components-dropdown-menu__indicator" /> }
					</IconButton>
				);
			} }
			renderContent={ ( props ) => {
				const mergedMenuProps = mergeProps( menuProps, {
					'aria-label': menuLabel || label,
					className: 'components-dropdown-menu__menu',
				} );

				return (
					<NavigableMenu
						{ ...mergedMenuProps }
						role="menu"
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

export default DropdownMenu;
