/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Toolbar from '../';
import {
	SVG,
	Path,
	ToolbarButton,
	ToolbarGroup,
	createToolbarSlotFill,
	SlotFillProvider,
} from '../../';

export default { title: 'Toolbar', component: Toolbar };

function InlineImageIcon() {
	return (
		<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<Path d="M4 16h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2zM4 5h10v9H4V5zm14 9v2h4v-2h-4zM2 20h20v-2H2v2zm6.4-8.8L7 9.4 5 12h8l-2.6-3.4-2 2.6z" />
		</SVG>
	);
}

export const _default = () => {
	return (
		<Toolbar accessibilityLabel="Options">
			<ToolbarGroup>
				<ToolbarButton icon="editor-paragraph" title="Paragraph" />
			</ToolbarGroup>
			<ToolbarGroup
				icon="editor-alignleft"
				title="Change text alignment"
				isCollapsed
				controls={ [
					{ icon: 'editor-alignleft', title: 'Align left', isActive: true },
					{ icon: 'editor-aligncenter', title: 'Align center' },
					{ icon: 'editor-alignright', title: 'Align right' },
				] }
			/>
			<ToolbarGroup>
				<ToolbarButton icon="editor-bold" title="Bold" />
				<ToolbarButton icon="editor-italic" title="Italic" />
				<ToolbarButton icon="admin-links" title="Link" />
				<ToolbarGroup
					isCollapsed
					icon={ false }
					title="More rich text controls"
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
				title="Change text alignment"
				isCollapsed
				controls={ [
					{ icon: 'editor-bold', title: 'Align left', isActive: true },
					{ icon: 'editor-aligncenter', title: 'Align center' },
					{ icon: 'editor-alignright', title: 'Align right' },
				] }
			/>
		</Toolbar>
	);
};

export const toolbarButton = () => {
	const icon = text( 'Icon', 'wordpress' );
	const title = text( 'Title', 'WordPress' );
	return <ToolbarButton icon={ icon } title={ title } />;
};

export const withoutGroups = () => {
	return (
		<Toolbar accessibilityLabel="Options">
			<ToolbarButton icon="editor-bold" title="Bold" />
			<ToolbarButton icon="editor-italic" title="Italic" />
			<ToolbarButton icon="admin-links" title="Link" />
		</Toolbar>
	);
};

export const withSlotFill = () => {
	const { Slot, Fill } = createToolbarSlotFill( 'toolbar' );

	return (
		<SlotFillProvider>
			<Toolbar accessibilityLabel="Options">
				<ToolbarButton icon="testimonial" title="Testimonial" />
				<Slot bubblesVirtually />
				<ToolbarButton icon="text" title="Text" />
			</Toolbar>
			<Fill>
				<ToolbarButton icon="thumbs-up" title="Thumbs up" />
				<ToolbarButton icon="thumbs-down" title="Thumbs down" />
			</Fill>
		</SlotFillProvider>
	);
};
