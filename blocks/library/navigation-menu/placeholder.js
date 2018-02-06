/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Placeholder, Spinner } from '@wordpress/components';
import SelectControl from '../../inspector-controls/select-control';

class MenuPlaceholder extends Component {
	getOptionsFromMenu( menu ) {
		return {
			value: menu.id,
			label: menu.name,
		};
	}

	render() {
		const { menus, selected, setMenu } = this.props;
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
				<SelectControl
					label={ __( 'Select an existing menu' ) }
					value={ selected }
					onChange={ setMenu }
					options={ menus.map( this.getOptionsFromMenu ) }
				/>
			</Placeholder>
		);
	}
}

export default MenuPlaceholder;
