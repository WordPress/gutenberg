/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Placeholder, Spinner } from '@wordpress/components';
import { Component } from '@wordpress/element';

class MenuPlaceholder extends Component {
	render() {
		const { children, menus } = this.props;
		const hasMenus = Array.isArray( menus ) && menus.length;

		if ( ! hasMenus ) {
			return (
				<Placeholder
					key="placeholder"
					icon="menu"
					label={ __( 'Navigation Menu' ) }>
					{ ! Array.isArray( menus ) ? (
						<Spinner />
					) : (
						<div>
							<span>{ __( 'No menus found.' ) }</span>
							{ ' ' }
							<Button
								href="customize.php?autofocus[panel]=nav_menus"
								target="_blank">
								{ __( 'Create a menu.' ) }
							</Button>
						</div>
					) }
				</Placeholder>
			);
		}

		return (
			<Placeholder
				key="block-placeholder"
				icon={ 'menu' }
				label={ __( 'Navigation Menu' ) }>
				{ children }
			</Placeholder>
		);
	}
}

export default MenuPlaceholder;
