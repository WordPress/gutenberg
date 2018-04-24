/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { MenuItem } from '@wordpress/components';
import { withPluginContext } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import PluginsMoreMenuGroup from '../plugins-more-menu-group';

const PluginScreenTakeoverMoreMenuItem = ( { children, isSelected, icon, onClick } ) => (
	<PluginsMoreMenuGroup>
		{ ( fillProps ) => (
			<MenuItem
				icon={ isSelected ? 'yes' : icon }
				isSelected={ isSelected }
				onClick={ compose( onClick, fillProps.onClose ) }
			>
				{ children }
			</MenuItem>
		) }
	</PluginsMoreMenuGroup>
);

export default compose(
	withPluginContext,
	withSelect( ( select, ownProps ) => {
		const { pluginContext, target } = ownProps;
		const screenTakeoverName = `${ pluginContext.name }/${ target }`;

		return {
			isSelected: select( 'core/edit-post' ).getActiveScreenTakeoverName() === screenTakeoverName,
			screenTakeoverName,
		};
	} ),
	withDispatch( ( dispatch, { isSelected, screenTakeoverName } ) => {
		const {
			closeScreenTakeover,
			openScreenTakeover,
		} = dispatch( 'core/edit-post' );
		const onClick = isSelected ?
			closeScreenTakeover :
			() => openScreenTakeover( screenTakeoverName );

		return { onClick };
	} ),
)( PluginScreenTakeoverMoreMenuItem );
