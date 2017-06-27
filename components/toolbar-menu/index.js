/**
 * External dependencies
 */
import clickOutside from 'react-click-outside';
import { findIndex } from 'lodash';

/**
 * WordPress dependencies
 */
import IconButton from 'components/icon-button';
import Dashicon from 'components/dashicon';
import { findDOMNode } from 'element';
import { TAB, ESCAPE, LEFT, UP, RIGHT, DOWN } from 'utils/keycodes';

/**
 * Internal dependencies
 */
import './style.scss';

class ToolbarMenu extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.bindMenuRef = this.bindMenuRef.bind( this );
		this.closeMenu = this.closeMenu.bind( this );
		this.toggleMenu = this.toggleMenu.bind( this );
		this.findActiveIndex = this.findActiveIndex.bind( this );
		this.focusIndex = this.focusIndex.bind( this );
		this.focusPrevious = this.focusPrevious.bind( this );
		this.focusNext = this.focusNext.bind( this );
		this.handleKeyDown = this.handleKeyDown.bind( this );
		this.menuRef = null;
		this.state = {
			open: false,
		};
	}

	bindMenuRef( node ) {
		this.menuRef = node;
	}

	handleClickOutside() {
		if ( ! this.state.open ) {
			return;
		}

		this.closeMenu();
	}

	closeMenu() {
		this.setState( {
			open: false,
		} );
	}

	toggleMenu() {
		this.setState( {
			open: ! this.state.open,
		} );
	}

	findActiveIndex() {
		if ( this.menuRef ) {
			const menu = findDOMNode( this.menuRef );
			const menuItem = document.activeElement;
			if ( menuItem.parentNode === menu ) {
				return findIndex( menu.children, ( child ) => child === menuItem );
			}
			return -1;
		}
	}

	focusIndex( index ) {
		if ( this.menuRef ) {
			const menu = findDOMNode( this.menuRef );
			menu.children[ index ].focus();
		}
	}

	focusPrevious() {
		const i = this.findActiveIndex();
		const prevI = i === 0 || i === -1 ? this.props.controls.length - 1 : i - 1;
		this.focusIndex( prevI );
	}

	focusNext() {
		const i = this.findActiveIndex();
		const nextI = i === ( this.props.controls.length - 1 ) || i === -1 ? 0 : i + 1;
		this.focusIndex( nextI );
	}

	handleKeyDown( keydown ) {
		if ( this.state.open ) {
			switch ( keydown.keyCode ) {
				case ESCAPE:
					keydown.preventDefault();
					this.closeMenu();
					if ( this.props.onSelect ) {
						this.props.onSelect( null );
					}
					break;

				case TAB:
					keydown.preventDefault();
					if ( keydown.shiftKey ) {
						this.focusPrevious();
					} else {
						this.focusNext();
					}
					break;

				case LEFT:
				case UP:
					keydown.preventDefault();
					this.focusPrevious();
					break;

				case RIGHT:
				case DOWN:
					keydown.preventDefault();
					this.focusNext();
					break;

				default:
					break;
			}
		}
	}

	componentDidMount() {
		document.addEventListener( 'keydown', this.handleKeyDown, false );
	}

	componentWillUnmount() {
		document.removeEventListener( 'keydown', this.handleKeyDown, false );
	}

	render() {
		const {
			icon = 'menu',
			label,
			menuLabel,
			controls,
			onSelect,
		} = this.props;

		if ( ! controls || ! controls.length ) {
			return null;
		}

		return (
			<div className="components-toolbar-menu">
				<IconButton
					className="components-toolbar-menu__toggle"
					icon={ icon }
					onClick={ this.toggleMenu }
					aria-haspopup="true"
					aria-expanded={ this.state.open }
					label={ label }
				>
					<Dashicon icon="arrow-down" />
				</IconButton>
				{ this.state.open &&
					<div
						className="components-toolbar-menu__menu"
						role="menu"
						aria-label={ menuLabel }
						ref={ this.bindMenuRef }
					>
						{ controls.map( ( control, index ) => (
							<IconButton
								key={ index }
								onClick={ ( event ) => {
									event.stopPropagation();
									this.closeMenu();
									if ( control.onClick ) {
										control.onClick();
									}
									if ( onSelect ) {
										onSelect( index );
									}
								} }
								className="components-toolbar-menu__menu-item"
								icon={ control.icon }
								role="menuitem"
							>
								{ control.title }
							</IconButton>
						) ) }
					</div>
				}
			</div>
		);
	}
}

export default clickOutside( ToolbarMenu );
