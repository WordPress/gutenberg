/**
 * WordPress dependencies
 */
import {
	createSlotFill,
	Button,
	ToolbarItem,
	Dropdown,
} from '@wordpress/components';
import warning from '@wordpress/warning';
import { plugins as pluginsIcon } from '@wordpress/icons';
import { compose } from '@wordpress/compose';
import { withPluginContext } from '@wordpress/plugins';

const { Fill, Slot } = createSlotFill( 'PluginHeaderToolbar' );

/**
 * Whether the argument is a function.
 *
 * @param {*} maybeFunc The argument to check.
 * @return {boolean} True if the argument is a function, false otherwise.
 */
function isFunction( maybeFunc ) {
	return typeof maybeFunc === 'function';
}

const PluginHeaderToolbarFill = ( {
	icon = pluginsIcon,
	renderContent = null,
	className = 'plugin-header-toolbar-button',
	contentClassName = 'plugin-header-toolbar-content',
} ) => {
	if ( null === renderContent || ! isFunction( renderContent ) ) {
		warning(
			'PluginHeaderToolbar requires renderContent property to be specified and be a valid function.'
		);
		return null;
	}
	return (
		<Fill>
			{ ( { showIconLabels } ) => (
				<ToolbarItem
					showTooltip={ ! showIconLabels }
					variant={ showIconLabels ? 'tertiary' : undefined }
					as={ () => (
						<Dropdown
							className={ className }
							contentClassName={ contentClassName }
							popoverProps={ { placement: 'bottom-start' } }
							renderToggle={ ( { isOpen, onToggle } ) => (
								<Button
									onClick={ onToggle }
									aria-expanded={ isOpen }
									icon={ icon }
									className="components-button"
								/>
							) }
							renderContent={ renderContent }
						/>
					) }
				/>
			) }
		</Fill>
	);
};

/**
 * Renders a button and association dropdown in the header toolbar.
 *
 * @param {Object}                props                                 Component properties.
 * @param {WPComponent}           renderContent                         The component to render as the UI for the dropdown.
 * @param {string}                [props.className]                     Optional. The class name for the button.
 * @param {string}                [props.contentClassName]              Optional. The class name of the dropdown item.
 * @param {WPBlockTypeIconRender} [props.icon=inherits from the plugin] The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug string, or an SVG WP element.
 *
 * @example
 * ```js
 * import { registerPlugin } from '@wordpress/plugins';
 * import { PluginHeaderToolbar } from '@wordpress/edit-post';
 *
 * const MyHeaderToolbarPlugin = () => (
 * 		<PluginHeaderToolbar
 *          className="plugin-header-toolbar-button"
 *          classContentName="plugin-header-toolbar-content"
 *          renderContent={() => <div>Rendered Content</div>}
 *        />
 *	);
 *
 *  registerPlugin( 'my-header-toolbar-plugin', { render: MyHeaderToolbarPlugin, icon: 'smiley' } );
 * ```
 *
 */
const PluginHeaderToolbar = compose(
	withPluginContext( ( context, ownProps ) => {
		return {
			icon: ownProps.icon || context.icon,
		};
	} )
)( PluginHeaderToolbarFill );

PluginHeaderToolbar.Slot = Slot;

export default PluginHeaderToolbar;
