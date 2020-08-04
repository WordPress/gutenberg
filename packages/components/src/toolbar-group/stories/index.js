/**
 * WordPress dependencies
 */
import { formatBold, formatItalic, link } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ToolbarButton, ToolbarGroup } from '../../';

export default { title: 'Components/ToolbarGroup', component: ToolbarGroup };

export const _default = () => {
	return (
		<ToolbarGroup>
			<ToolbarButton icon={ formatBold } title="Bold" isActive />
			<ToolbarButton icon={ formatItalic } title="Italic" />
			<ToolbarButton icon={ link } title="Link" />
		</ToolbarGroup>
	);
};

export const withControlsProp = () => {
	return (
		<ToolbarGroup
			controls={ [
				{ icon: formatBold, title: 'Bold', isActive: true },
				{ icon: formatItalic, title: 'Italic' },
				{ icon: link, title: 'Link' },
			] }
		/>
	);
};
