/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react-vite';

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
	arrowUp,
	arrowDown,
	arrowLeft,
	arrowRight,
	chevronDown,
	inlineImage,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	Toolbar,
	ToolbarButton,
	ToolbarGroup,
	ToolbarItem,
	ToolbarDropdownMenu,
} from '..';
import DropdownMenu from '../../dropdown-menu';

const meta: Meta< typeof Toolbar > = {
	title: 'Components/Toolbar',
	component: Toolbar,
	subcomponents: {
		ToolbarButton,
		ToolbarGroup,
		ToolbarItem,
		ToolbarDropdownMenu,
	},
	argTypes: {
		children: { control: false },
		variant: {
			options: [ undefined, 'unstyled' ],
			control: { type: 'radio' },
		},
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'recommended',
			whereUsed: 'editor',
		},
	},
};

export default meta;

const Template: StoryFn< typeof Toolbar > = ( props ) => (
	<div style={ { height: 280 } }>
		<Toolbar { ...props } />
	</div>
);

export const Default = Template.bind( {} );
Default.args = {
	label: 'Options',
	id: 'options-toolbar',
	children: (
		<>
			<ToolbarGroup>
				<ToolbarButton icon={ paragraph } text="Paragraph" />
			</ToolbarGroup>
			<ToolbarGroup>
				<ToolbarItem>
					{ ( toggleProps ) => (
						<DropdownMenu
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
					icon={ null }
					title="More rich text controls"
					controls={ [
						{ icon: code, title: 'Inline code' },
						{ icon: inlineImage, title: 'Inline image' },
						{
							icon: formatStrikethrough,
							title: 'Strikethrough',
						},
					] }
				/>
			</ToolbarGroup>
			<ToolbarGroup
				icon={ more }
				title="Align"
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
			<ToolbarDropdownMenu
				icon={ chevronDown }
				label="Select a direction"
				controls={ [
					{
						title: 'Up',
						icon: arrowUp,
					},
					{
						title: 'Right',
						icon: arrowRight,
					},
					{
						title: 'Down',
						icon: arrowDown,
					},
					{
						title: 'Left',
						icon: arrowLeft,
					},
				] }
			/>
		</>
	),
};

export const WithoutGroup = Template.bind( {} );
WithoutGroup.args = {
	label: 'Options',
	id: 'options-toolbar-without-group',
	children: (
		<>
			<ToolbarButton icon={ formatBold } label="Bold" isPressed />
			<ToolbarButton icon={ formatItalic } label="Italic" />
			<ToolbarButton icon={ link } label="Link" />
		</>
	),
};

/**
 * Set the variant to `unstyled` to remove default border styles.
 * Otherwise, leave it as `undefined` for default styles.
 */

export const Unstyled = Template.bind( {} );
Unstyled.args = {
	...Default.args,
	variant: 'unstyled',
};
