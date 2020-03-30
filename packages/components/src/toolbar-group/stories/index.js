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

export const toolbars = () => {
	return (
		<div>
			<div style={ { padding: '20px' } }>
				<h2>Icon-only Toolbar</h2>
				<ToolbarGroup>
					<ToolbarButton icon={ formatBold } title="Bold" />
					<ToolbarButton
						icon={ formatItalic }
						title="Italic"
						isActive
					/>
					<ToolbarButton icon={ link } title="Link" />
				</ToolbarGroup>
			</div>

			<div style={ { padding: '20px' } }>
				<h2>Text-only Toolbar</h2>
				<ToolbarGroup>
					<ToolbarButton>Bold Format</ToolbarButton>
					<ToolbarButton isActive>Italic Format</ToolbarButton>
					<ToolbarButton>Link Format</ToolbarButton>
				</ToolbarGroup>
			</div>

			<div style={ { padding: '20px' } }>
				<h2>Text and Icon Toolbar</h2>
				<ToolbarGroup>
					<ToolbarButton icon={ formatBold } title="Bold" />
					<ToolbarButton isActive>Bold Format</ToolbarButton>
					<ToolbarButton icon={ formatItalic } title="Italic" />
					<ToolbarButton>Italic Format</ToolbarButton>
					<ToolbarButton icon={ link } title="Link" />
					<ToolbarButton>Link Format</ToolbarButton>
				</ToolbarGroup>
			</div>

			<div style={ { padding: '20px' } }>
				<h2>Single Icon Button Toolbar</h2>
				<ToolbarGroup>
					<ToolbarButton icon={ formatBold } title="Bold" />
				</ToolbarGroup>
			</div>

			<div style={ { padding: '20px' } }>
				<h2>Single Text Button toolbar</h2>
				<ToolbarGroup>
					<ToolbarButton>Bold Toolbar</ToolbarButton>
				</ToolbarGroup>
			</div>
		</div>
	);
};
