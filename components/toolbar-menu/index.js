/**
 * External dependencies
 */
import clickOutside from 'react-click-outside';

/**
 * WordPress dependencies
 */
import IconButton from 'components/icon-button';
import Dashicon from 'components/dashicon';

/**
 * Internal dependencies
 */
import './style.scss';

class ToolbarMenu extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.closeMenu = this.closeMenu.bind( this );
		this.toggleMenu = this.toggleMenu.bind( this );
		this.state = {
			open: false,
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
						tabIndex="0"
						aria-label={ menuLabel }
					>
						{ controls.map( ( control, index ) => (
							<IconButton
								key={ index }
								onClick={ ( event ) => {
									event.stopPropagation();
									this.closeMenu();
									control.onClick();
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
