/**
 * External dependencies
 */
import classnames from 'classnames';
import { find, isArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { Button, TinymceIcon, Popover, Dashicon } from 'components';

/**
 * Internal dependencies
 */
import MenuItems from './menu-items';

class MenuButton extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isActive: false,
			isDisabled: false,
			opened: false,
		};
		this.mounted = true;
		this.toggleMenu = this.toggleMenu.bind( this );
		this.closeMenu = this.closeMenu.bind( this );
	}

	componentDidMount() {
		const { button } = this.props;
		const fnNames = [ 'onPostRender', 'onpostrender', 'OnPostRender' ];
		const onPostRender = find( fnNames, ( fn ) => button.hasOwnProperty( fn ) );
		if ( onPostRender ) {
			button[ onPostRender ].call( {
				active: ( isActive ) => this.mounted && this.setState( { isActive } ),
				disabled: ( isDisabled ) => this.mounted && this.setState( { isDisabled } ),
			} );
		}
	}

	componentWillUnmount() {
		this.mounted = false;
	}

	closeMenu() {
		this.setState( { opened: false } );
	}

	toggleMenu( event ) {
		event.stopPropagation();
		this.setState( ( state ) => ( {
			opened: ! state.opened,
		} ) );
	}

	render() {
		const { button } = this.props;
		const { isActive, isDisabled, opened } = this.state;
		const items = isArray( button.menu ) ? button.menu : button.menu.items;

		return [
			<Button
				key="button"
				label={ button.text }
				onClick={ this.toggleMenu }
				className={ classnames( 'components-toolbar__control', {
					'is-active': isActive,
				} ) }
				aria-pressed={ isActive }
				disabled={ isDisabled }
			>
				{ button.icon && <TinymceIcon icon={ button.icon } /> }
				{ button.text }
				<Dashicon icon="arrow-down" />
			</Button>,
			opened && (
				<Popover position="bottom center" key="menu">
					<MenuItems button={ button } items={ items } onClose={ this.closeMenu } />
				</Popover>
			),
		];
	}
}

export default MenuButton;
