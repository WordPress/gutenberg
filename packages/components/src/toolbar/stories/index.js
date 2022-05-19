/**
 * WordPress dependencies
 */
import {
	alignCenter,
	alignLeft,
	alignRight,
	code,
	formatBold,
	formatItalic,
	formatStrikethrough,
	link,
	more,
	paragraph,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Toolbar from '../';
import {
	SVG,
	Path,
	ToolbarButton,
	ToolbarGroup,
	ToolbarItem,
	DropdownMenu,
} from '../../';

export default { title: 'Components/Toolbar', component: Toolbar };

function InlineImageIcon() {
	return (
		<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<Path d="M4 18.5h16V17H4v1.5zM16 13v1.5h4V13h-4zM5.1 15h7.8c.6 0 1.1-.5 1.1-1.1V6.1c0-.6-.5-1.1-1.1-1.1H5.1C4.5 5 4 5.5 4 6.1v7.8c0 .6.5 1.1 1.1 1.1zm.4-8.5h7V10l-1-1c-.3-.3-.8-.3-1 0l-1.6 1.5-1.2-.7c-.3-.2-.6-.2-.9 0l-1.3 1V6.5zm0 6.1l1.8-1.3 1.3.8c.3.2.7.2.9-.1l1.5-1.4 1.5 1.4v1.5h-7v-.9z" />
		</SVG>
	);
}

/* eslint-disable no-restricted-syntax */
export const _default = () => {
	return (
		// id is required for server side rendering
		<Toolbar label="Options" id="options-toolbar">
			<ToolbarGroup>
				<ToolbarButton icon={ paragraph } label="Paragraph" />
			</ToolbarGroup>
			<ToolbarGroup>
				<ToolbarItem>
					{ ( toggleProps ) => (
						<DropdownMenu
							hasArrowIndicator
							icon={ alignLeft }
							label="Align"
							controls={ [
								{
									icon: alignLeft,
									title: 'Align left',
									isActive: true,
								},
								{
									icon: alignCenter,
									title: 'Align center',
								},
								{
									icon: alignRight,
									title: 'Align right',
								},
							] }
							toggleProps={ toggleProps }
						/>
					) }
				</ToolbarItem>
			</ToolbarGroup>
			<ToolbarGroup>
				<ToolbarButton>Text</ToolbarButton>
				<ToolbarButton icon={ formatBold } label="Bold" isPressed />
				<ToolbarButton icon={ formatItalic } label="Italic" />
				<ToolbarButton icon={ link } label="Link" />
				<ToolbarGroup
					isCollapsed
					icon={ false }
					label="More rich text controls"
					controls={ [
						{ icon: code, title: 'Inline code' },
						{ icon: <InlineImageIcon />, title: 'Inline image' },
						{
							icon: formatStrikethrough,
							title: 'Strikethrough',
						},
					] }
				/>
			</ToolbarGroup>
			<ToolbarGroup
				icon={ more }
				label="Align"
				isCollapsed
				controls={ [
					{
						icon: alignLeft,
						title: 'Align left',
						isActive: true,
					},
					{ icon: alignCenter, title: 'Align center' },
					{ icon: alignRight, title: 'Align right' },
				] }
			/>
		</Toolbar>
	);
};

export const withoutGroup = () => {
	return (
		// id is required for server side rendering
		<Toolbar label="Options" id="options-toolbar-without-group">
			<ToolbarButton icon={ formatBold } label="Bold" isPressed />
			<ToolbarButton icon={ formatItalic } label="Italic" />
			<ToolbarButton icon={ link } label="Link" />
		</Toolbar>
	);
};
/* eslint-enable no-restricted-syntax */

export const toolbars = () => {
	return (
		<div>
			<div style={ { padding: '20px' } }>
				<h2>Icon-only Toolbar</h2>
				<Toolbar>
					<ToolbarButton icon={ formatBold } title="Bold" />
					<ToolbarButton
						icon={ formatItalic }
						title="Italic"
						isActive
					/>
					<ToolbarButton icon={ link } title="Link" />
				</Toolbar>
			</div>

			<div style={ { padding: '20px' } }>
				<h2>Text-only Toolbar</h2>
				<Toolbar>
					<ToolbarButton>Bold Format</ToolbarButton>
					<ToolbarButton isActive>Italic Format</ToolbarButton>
					<ToolbarButton>Link Format</ToolbarButton>
				</Toolbar>
			</div>

			<div style={ { padding: '20px' } }>
				<h2>Text and Icon Toolbar</h2>
				<Toolbar>
					<ToolbarButton icon={ formatBold } title="Bold" />
					<ToolbarButton isActive>Bold Format</ToolbarButton>
					<ToolbarButton icon={ formatItalic } title="Italic" />
					<ToolbarButton>Italic Format</ToolbarButton>
					<ToolbarButton icon={ link } title="Link" />
					<ToolbarButton>Link Format</ToolbarButton>
				</Toolbar>
			</div>

			<div style={ { padding: '20px' } }>
				<h2>Single Icon Button Toolbar</h2>
				<Toolbar>
					<ToolbarButton icon={ formatBold } title="Bold" />
				</Toolbar>
			</div>

			<div style={ { padding: '20px' } }>
				<h2>Single Text Button toolbar</h2>
				<Toolbar>
					<ToolbarButton>Bold Toolbar</ToolbarButton>
				</Toolbar>
			</div>
		</div>
	);
};
