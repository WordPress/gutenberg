/**
 * External dependencies
 */
import { map, isEmpty, isString } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { NavigableMenu, withInstanceId, IconButton, MenuItemsSeparator } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { getEditorMenuItems } from '../../../api/editor-menu-item';

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

	const { instanceId } = props;

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

	const labelId = `components-choice-menu-plugins-label-${ instanceId }`;

	return [
		<MenuItemsSeparator key="plugins-separator" />,
		<div
			key="plugins-menu-items"
			className="components-choice-menu-plugins" >
			<div className="components-choice-menu-plugins__label">{ __( 'Plugins' ) }</div>
			<NavigableMenu orientation="vertical" aria-labelledby={ labelId }>
				{
					map( ellipsisMenuItems, menuItem => {
						if ( isString( menuItem.icon ) ) {
							menuItem.icon = null;
						}
						const buttonClassName = classnames(
							'components-menu-item-plugins__button',
							menuItem.icon ? 'has-icon' : null
						);

						return (
							<IconButton
								key={ menuItem.name }
								className={ buttonClassName }
								icon={
									menuItem.icon ?
										<div className="components-menu-item-plugins__icon-container" >
											{ menuItem.icon }
										</div> : null
								}
								onClick={ () => onSelect( menuItem.name ) }>
								{ menuItem.title }
							</IconButton>
						);
					} )
				}
			</NavigableMenu>
		</div>,
	];
}

export default withInstanceId( Plugins );
