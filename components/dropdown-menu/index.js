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
		this.handleKeyUp = this.handleKeyUp.bind( this );

		this.nodes = {};

		this.state = {
			activeIndex: null,
			open: false,
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

	toggleMenu() {
		this.setState( {
			open: ! this.state.open,
		} );
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
			// eslint-disable-next-line react/no-find-dom-node
			findDOMNode( this.nodes.toggle ).focus();
			this.closeMenu();
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
					ref={ this.bindReferenceNode( 'toggle' ) }
				>
					<Dashicon icon="arrow-down" />
				</IconButton>
				{ this.state.open &&
					<div
						className="components-dropdown-menu__menu"
						role="menu"
						aria-label={ menuLabel }
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
