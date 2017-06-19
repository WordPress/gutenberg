/**
 * External dependencies
 */
import { isObject, isArray, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { Popover, TinymceIcon } from 'components';

class MenuItems extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			opened: {},
		};
		this.onHoverMenuItem = this.onHoverMenuItem.bind( this );
		this.onUnHoverMenuItem = this.onUnHoverMenuItem.bind( this );
	}

	onHoverMenuItem( index ) {
		return () => this.setState(
			( state ) => ( {
				opened: {
					...state.opened,
					[ index ]: true,
				},
			} )
		);
	}

	onUnHoverMenuItem( index ) {
		return () => this.setState(
			( state ) => ( {
				opened: {
					...state.opened,
					[ index ]: false,
				},
			} )
		);
	}

	render() {
		const { button, items, onClose } = this.props;
		const defaultOnclick = isArray( button.menu ) ? noop : button.menu.itemDefaults.onclick;

		return items.map( ( choice, index ) => {
			const buttonText = isObject( choice.text ) ? choice.text.raw : choice.text;
			const onClick = () => {
				if ( choice.onclick ) {
					choice.onclick();
				} else if ( ! choice.menu ) {
					defaultOnclick();
				}
				onClose();
			};

			return (
				<div
					key={ index }
					onMouseEnter={ this.onHoverMenuItem( index ) }
					onMouseLeave={ this.onUnHoverMenuItem( index ) }
					className="blocks-buttons__menu-items-item"
				>
					<button className="blocks-buttons__menu-items-item-toggle" onClick={ onClick }>
						{ choice.icon && <TinymceIcon icon={ choice.icon } /> }
						{ buttonText }
					</button>
					{ choice.menu && this.state.opened[ index ] && (
						<Popover position="custom custom" className="blocks-buttons__menu-items-item-submenu">
							<MenuItems button={ button } items={ choice.menu } onClose={ onClose } />
						</Popover>
					) }
				</ div>
			);
		} );
	}
}

export default MenuItems;
