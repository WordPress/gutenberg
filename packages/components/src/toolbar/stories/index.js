/**
 * Internal dependencies
 */
import Toolbar from '../';
import {
	SVG,
	Path,
	ToolbarButton,
	ToolbarGroup,
	__experimentalToolbarItem as ToolbarItem,
	DropdownMenu,
} from '../../';

export default { title: 'Components|Toolbar', component: Toolbar };

function InlineImageIcon() {
	return (
		<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<Path d="M4 16h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2zM4 5h10v9H4V5zm14 9v2h4v-2h-4zM2 20h20v-2H2v2zm6.4-8.8L7 9.4 5 12h8l-2.6-3.4-2 2.6z" />
		</SVG>
	);
}

/* eslint-disable no-restricted-syntax */
export const _default = () => {
	return (
		// id is required for server side rendering
		<Toolbar __experimentalAccessibilityLabel="Options" id="options-toolbar">
			<ToolbarGroup>
				<ToolbarButton icon="editor-paragraph" label="Paragraph" />
			</ToolbarGroup>
			<ToolbarGroup>
				<ToolbarItem>
					{ ( toggleProps ) => (
						<DropdownMenu
							hasArrowIndicator
							icon="editor-alignleft"
							label="Change text alignment"
							controls={ [
								{ icon: 'editor-alignleft', title: 'Align left', isActive: true },
								{ icon: 'editor-aligncenter', title: 'Align center' },
								{ icon: 'editor-alignright', title: 'Align right' },
							] }
							toggleProps={ toggleProps }
						/>
					) }
				</ToolbarItem>
			</ToolbarGroup>
			<ToolbarGroup>
				<ToolbarButton>Text</ToolbarButton>
				<ToolbarButton icon="editor-bold" label="Bold" isPressed />
				<ToolbarButton icon="editor-italic" label="Italic" />
				<ToolbarButton icon="admin-links" label="Link" />
				<ToolbarGroup
					isCollapsed
					icon={ false }
					label="More rich text controls"
					controls={ [
						{ icon: 'editor-code', title: 'Inline code' },
						{ icon: <InlineImageIcon />, title: 'Inline image' },
						{ icon: 'editor-strikethrough', title: 'Strikethrough' },
					] }
				/>
			</ToolbarGroup>
			<ToolbarGroup
				hasArrowIndicator={ false }
				icon="ellipsis"
				label="Change text alignment"
				isCollapsed
				controls={ [
					{ icon: 'editor-alignleft', title: 'Align left', isActive: true },
					{ icon: 'editor-aligncenter', title: 'Align center' },
					{ icon: 'editor-alignright', title: 'Align right' },
				] }
			/>
		</Toolbar>
	);
};

export const withoutGroup = () => {
	return (
		// id is required for server side rendering
		<Toolbar
			__experimentalAccessibilityLabel="Options"
			id="options-toolbar-without-group"
		>
			<ToolbarButton icon="editor-bold" label="Bold" isPressed />
			<ToolbarButton icon="editor-italic" label="Italic" />
			<ToolbarButton icon="admin-links" label="Link" />
		</Toolbar>
	);
};
/* eslint-enable no-restricted-syntax */
