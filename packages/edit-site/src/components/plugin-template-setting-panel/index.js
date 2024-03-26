/**
 * Defines an extensibility slot for the Template sidebar.
 */

/**
 * WordPress dependencies
 */
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { createSlotFill } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'PluginTemplateSettingPanel' );

const PluginTemplateSettingPanel = ( { children } ) => {
	const isCurrentEntityTemplate = useSelect(
		( select ) =>
			select( editorStore ).getCurrentPostType() === 'wp_template',
		[]
	);
	if ( ! isCurrentEntityTemplate ) {
		return null;
	}
	return <Fill>{ children }</Fill>;
};

PluginTemplateSettingPanel.Slot = Slot;

/**
 * Renders items in the Template Sidebar below the main information
 * like the Template Card.
 *
 * @example
 * ```jsx
 * // Using ESNext syntax
 * import { PluginTemplateSettingPanel } from '@wordpress/edit-site';
 *
 * const MyTemplateSettingTest = () => (
 * 		<PluginTemplateSettingPanel>
 *			<p>Hello, World!</p>
 *		</PluginTemplateSettingPanel>
 *	);
 * ```
 *
 * @return {Component} The component to be rendered.
 */
export default PluginTemplateSettingPanel;
