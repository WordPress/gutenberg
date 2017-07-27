/**
 * External dependencies
 */
import classnames from 'classnames';
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

class DropdownMenu extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.bindMenuReferenceNode = this.bindMenuReferenceNode.bind( this );
		this.closeMenu = this.closeMenu.bind( this );
		this.toggleMenu = this.toggleMenu.bind( this );
		this.findActiveIndex = this.findActiveIndex.bind( this );
		this.focusIndex = this.focusIndex.bind( this );
		this.focusPrevious = this.focusPrevious.bind( this );
		this.focusNext = this.focusNext.bind( this );
		this.handleKeyDown = this.handleKeyDown.bind( this );
		this.handleKeyUp = this.handleKeyUp.bind( this );
		this.menuNode = null;
		this.state = {
			open: false,
		};
	}

	bindMenuReferenceNode( node ) {
		this.menuNode = node;
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
		if ( this.menuNode ) {
			const menuItem = document.activeElement;
			if ( menuItem.parentNode === this.menuNode ) {
				return findIndex( this.menuNode.children, ( child ) => child === menuItem );
			}
			return -1;
		}
	}

	focusIndex( index ) {
		if ( this.menuNode ) {
			this.menuNode.children[ index ].focus();
		}
	}

	focusPrevious() {
		const i = this.findActiveIndex();
		const maxI = this.props.controls.length - 1;
		const prevI = i <= 0 ? maxI : i - 1;
		this.focusIndex( prevI );
	}

	focusNext() {
		const i = this.findActiveIndex();
		const maxI = this.props.controls.length - 1;
		const nextI = i >= maxI ? 0 : i + 1;
		this.focusIndex( nextI );
	}

	handleKeyUp( event ) {
		// TODO: find a better way to isolate events on nested components see GH issue #1973.
		/*
		 * VisualEditorBlock uses a keyup event to deselect the block. When the
		 * menu is open we need to stop propagation after Escape has been pressed
		 * so we use a keyup event instead of keydown, otherwise the whole block
		 * toolbar will disappear.
		 */
		if ( event.keyCode === ESCAPE && this.state.open ) {
			event.preventDefault();
			event.stopPropagation();
			const node = findDOMNode( this );
			const toggle = node.querySelector( '.components-dropdown-menu__toggle' );
			toggle.focus();
			this.closeMenu();
			if ( this.props.onSelect ) {
				this.props.onSelect( null );
			}
		}
	}

	handleKeyDown( keydown ) {
		if ( this.state.open ) {
			switch ( keydown.keyCode ) {
				case TAB:
					keydown.stopPropagation();
					this.closeMenu();
					break;

				case LEFT:
				case UP:
					keydown.preventDefault();
					keydown.stopPropagation();
					this.focusPrevious();
					break;

				case RIGHT:
				case DOWN:
					keydown.preventDefault();
					keydown.stopPropagation();
					this.focusNext();
					break;

				default:
					break;
			}
		} else {
			switch ( keydown.keyCode ) {
				case DOWN:
					keydown.preventDefault();
					keydown.stopPropagation();
					this.toggleMenu();
					break;

				default:
					break;
			}
		}
	}

	componentDidUpdate( prevProps, prevState ) {
		// Focus the first item when the menu opens.
		if ( ! prevState.open && this.state.open ) {
			this.focusIndex( 0 );
		}
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

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div
				className="components-dropdown-menu"
				onKeyDown={ this.handleKeyDown }
				onKeyUp={ this.handleKeyUp }
			>
				<IconButton
					className={
						classnames( 'components-dropdown-menu__toggle', {
							'is-active': this.state.open,
						} )
					}
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
						className="components-dropdown-menu__menu"
						role="menu"
						aria-label={ menuLabel }
						ref={ this.bindMenuReferenceNode }
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
								className="components-dropdown-menu__menu-item"
								icon={ control.icon }
								role="menuitem"
								tabIndex="-1"
							>
								{ control.title }
							</IconButton>
						) ) }
					</div>
				}
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	}
}

export default clickOutside( DropdownMenu );
