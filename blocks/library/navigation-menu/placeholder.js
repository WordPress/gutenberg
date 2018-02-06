/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Placeholder, Spinner } from '@wordpress/components';

class MenuPlaceholder extends Component {
	render() {
		const { children, menus } = this.props;
		const hasMenus = Array.isArray( menus ) && menus.length;

		if ( ! hasMenus ) {
			return (
				<Placeholder key="placeholder"
					icon="menu"
					label={ __( 'Navigation Menu' ) }
				>
					{ ! Array.isArray( menus ) ?
						<Spinner /> :
						__( 'No menus found.' )
					}
				</Placeholder>
			);
		}

		return (
			<Placeholder
				key="block-placeholder"
				icon={ 'menu' }
				label={ __( 'Navigation Menu' ) } >
				{ children }
			</Placeholder>
		);
	}
}

export default MenuPlaceholder;
