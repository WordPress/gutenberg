/**
 * External dependencies
 */
import classnames from 'classnames';
import clickOutside from 'react-click-outside';

/**
 * WordPress dependencies
 */
import { Component, findDOMNode } from '@wordpress/element';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import IconButton from '../icon-button';
import Dashicon from '../dashicon';

const { TAB, ESCAPE, LEFT, UP, RIGHT, DOWN } = keycodes;

export class DropdownMenu extends Component {
	constructor() {
		super( ...arguments );

		this.bindReferenceNode = this.bindReferenceNode.bind( this );
		this.closeMenu = this.closeMenu.bind( this );
		this.toggleMenu = this.toggleMenu.bind( this );
		this.focusIndex = this.focusIndex.bind( this );
		this.focusPrevious = this.focusPrevious.bind( this );
		this.focusNext = this.focusNext.bind( this );
		this.handleKeyDown = this.handleKeyDown.bind( this );
		this.calculateMenuPosition = this.calculateMenuPosition.bind( this );

		this.nodes = {};
		this.timer = null;

		this.state = {
			activeIndex: null,
			open: false,
			menuLeft: 0,
		};
	}

	bindReferenceNode( name ) {
		return ( node ) => {
			this.nodes[ name ] = node;
		};
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

	calculateMenuPosition() {
		const { toggle } = this.nodes;
		if ( ! toggle ) {
			return;
		}
		const node = findDOMNode( toggle );
		let n = node;
		let scrollLeft = 0;
		while ( n !== null && n !== node.offsetParent ) {
			scrollLeft += n.scrollLeft;
			n = n.parentNode;
		}
		const menuLeft = node.offsetLeft - scrollLeft - 4;
		if ( this.state.menuLeft !== menuLeft ) {
			this.setState( { menuLeft } );
		}
	}

	toggleMenu() {
		const open = ! this.state.open;
		if ( open ) {
			this.calculateMenuPosition();
		}
		this.setState( { open } );
	}

	focusIndex( activeIndex ) {
		this.setState( { activeIndex } );
	}

	focusPrevious() {
		const { activeIndex } = this.state;
		const { controls } = this.props;
		if ( ! controls ) {
			return;
		}

		const maxIndex = controls.length - 1;
		const prevIndex = activeIndex <= 0 ? maxIndex : activeIndex - 1;
		this.focusIndex( prevIndex );
	}

	focusNext() {
		const { activeIndex } = this.state;
		const { controls } = this.props;
		if ( ! controls ) {
			return;
		}

		const nextIndex = ( activeIndex + 1 ) % controls.length;
		this.focusIndex( nextIndex );
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
				case ESCAPE:
					keydown.preventDefault();
					keydown.stopPropagation();
					// eslint-disable-next-line react/no-find-dom-node
					findDOMNode( this.nodes.toggle ).focus();
					this.closeMenu();
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
		const { open, activeIndex } = this.state;

		// Focus the first item when the menu opens.
		if ( ! prevState.open && open ) {
			this.focusIndex( 0 );
		}

		// Change focus to active index
		const { menu } = this.nodes;
		if ( prevState.activeIndex !== activeIndex &&
				Number.isInteger( activeIndex ) &&
				menu && menu.children[ activeIndex ] ) {
			menu.children[ activeIndex ].focus();
		}
	}

	render() {
		const {
			icon = 'menu',
			label,
			menuLabel,
			controls,
		} = this.props;
		const {
			open,
			menuLeft,
		} = this.state;

		if ( ! controls || ! controls.length ) {
			return null;
		}
		// monitor the menu position when open
		if ( open ) {
			if ( this.timer === null ) {
				this.timer = setInterval( this.calculateMenuPosition, 100 );
			}
		} else if ( this.timer !== null ) {
			clearInterval( this.timer );
			this.timer = null;
		}
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div
				className="components-dropdown-menu"
				onKeyDown={ this.handleKeyDown }
			>
				<IconButton
					className={
						classnames( 'components-dropdown-menu__toggle', {
							'is-active': open,
						} )
					}
					icon={ icon }
					onClick={ this.toggleMenu }
					aria-haspopup="true"
					aria-expanded={ open }
					label={ label }
					ref={ this.bindReferenceNode( 'toggle' ) }
				>
					<Dashicon icon="arrow-down" />
				</IconButton>
				{ open &&
					<div
						className="components-dropdown-menu__menu"
						role="menu"
						aria-label={ menuLabel }
						style={ { left: menuLeft } }
						ref={ this.bindReferenceNode( 'menu' ) }
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
