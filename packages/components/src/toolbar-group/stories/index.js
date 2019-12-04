/**
 * Internal dependencies
 */
import { ToolbarButton, ToolbarGroup } from '../../';

export default { title: 'Components|ToolbarGroup', component: ToolbarGroup };

export const _default = () => {
	return (
		<ToolbarGroup>
			<ToolbarButton icon="editor-bold" title="Bold" isActive />
			<ToolbarButton icon="editor-italic" title="Italic" />
			<ToolbarButton icon="admin-links" title="Link" />
		</ToolbarGroup>
	);
};

export const withControlsProp = () => {
	return (
		<ToolbarGroup
			controls={ [
				{ icon: 'editor-bold', title: 'Bold', isActive: true },
				{ icon: 'editor-italic', title: 'Italic' },
				{ icon: 'admin-links', title: 'Link' },
			] }
		/>
	);
};
