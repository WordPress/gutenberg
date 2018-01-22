/**
 * External dependencies
 */
import { map, isEmpty, isString } from 'lodash';
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { NavigableMenu, withInstanceId, IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { getEllipsisMenuItems } from '../../../api/ellipsis-menu';

/**
 * Renders a list of plugins that will activate different UI elements.
 *
 * @param   {Object} props The component props.
 * @returns {Object} The rendered list of menu items.
 */
function Plugins( props ) {
	const ellipsisMenuItems = getEllipsisMenuItems();

	if ( isEmpty( ellipsisMenuItems ) ) {
		return null;
	}

	const {
		instanceId,
	} = props;

	/**
	 * Handles the user clicking on one of the plugins in the menu
	 *
	 * Does nothing currently, but should be used to trigger the plugins sidebar
	 *
	 * @param {string} pluginId The plugin id.
	 * @returns {void}
	 */
	function onSelect( pluginId ) {
		props.onSelect();
		ellipsisMenuItems[ pluginId ].callback();
	}

	const plugins = map( ellipsisMenuItems, ( menuItem ) => {
		return {
			value: menuItem.name,
			label: menuItem.title,
			icon: menuItem.icon,
		};
	} );

	const labelId = `components-choice-menu-plugins-label-${ instanceId }`;

	return [
		<div
			key="plugins-separator"
			className="editor-ellipsis-menu__separator" />,
		<div
			key="plugins-menu-items"
			className="components-choice-menu-plugins" >
			<div className="components-choice-menu-plugins__label">{ __( 'Plugins' ) }</div>
			<NavigableMenu orientation="vertical" aria-labelledby={ labelId }>
				{
					plugins.map( plugin => {
						if ( isString( plugin.icon ) ) {
							plugin.icon = null;
						}
						const buttonClassName = classnames(
							'components-menu-items__button',
							plugin.icon ? 'has-icon' : null
						);
						return (
							<IconButton
								key={ plugin.value }
								className={ buttonClassName }
								icon={ plugin.icon }
								onClick={ () => onSelect( plugin.value ) }>
								{ plugin.label }
							</IconButton>
						);
					} )
				}
			</NavigableMenu>
		</div>
	];
}

export default withInstanceId(
	connect(
		( state ) => {
			return state;
		}
	)( Plugins )
);
