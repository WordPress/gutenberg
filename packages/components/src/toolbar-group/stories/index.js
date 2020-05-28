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
			<ToolbarButton icon={ formatBold } label="Bold" isPressed />
			<ToolbarButton icon={ formatItalic } label="Italic" />
			<ToolbarButton icon={ link } label="Link" />
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
