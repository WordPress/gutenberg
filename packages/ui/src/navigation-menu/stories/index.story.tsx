import { DirectionProvider } from '@base-ui/react/direction-provider';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { forwardRef, useState } from '@wordpress/element';
import { archive } from '@wordpress/icons';
import {
	ariaKeyShortcut,
	displayShortcut,
	shortcutAriaLabel,
} from '@wordpress/keycodes';
import { Icon } from '../../icon';
import * as NavigationMenu from '../';

const meta: Meta< typeof NavigationMenu.Root > = {
	title: 'Design System/Components/NavigationMenu',
	component: NavigationMenu.Root,
	tags: [ 'manifest' ],
	subcomponents: {
		'NavigationMenu.List': NavigationMenu.List,
		'NavigationMenu.Item': NavigationMenu.Item,
		'NavigationMenu.Link': NavigationMenu.Link,
		'NavigationMenu.Trigger': NavigationMenu.Trigger,
		'NavigationMenu.Icon': NavigationMenu.Icon,
		'NavigationMenu.Content': NavigationMenu.Content,
		'NavigationMenu.Popup': NavigationMenu.Popup,
		'NavigationMenu.Portal': NavigationMenu.Portal,
		'NavigationMenu.Positioner': NavigationMenu.Positioner,
		'NavigationMenu.Viewport': NavigationMenu.Viewport,
		'NavigationMenu.Arrow': NavigationMenu.Arrow,
		'NavigationMenu.Backdrop': NavigationMenu.Backdrop,
		'NavigationMenu.ItemLabel': NavigationMenu.ItemLabel,
		'NavigationMenu.ItemDescription': NavigationMenu.ItemDescription,
	},
	argTypes: {
		children: { control: false },
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
		},
	},
};

export default meta;

type Story = StoryObj< typeof NavigationMenu.Root >;

const SHORTCUT = {
	displayShortcut: displayShortcut.primary( 'p' ),
	ariaKeyShortcut: ariaKeyShortcut.primary( 'p' ),
	description: shortcutAriaLabel.primary( 'p' ),
};

function DefaultPopup( { arrow = false }: { arrow?: boolean } ) {
	return (
		<NavigationMenu.Popup>
			{ arrow && <NavigationMenu.Arrow /> }
			<NavigationMenu.Viewport />
		</NavigationMenu.Popup>
	);
}

function AppearanceLinks() {
	return (
		<NavigationMenu.Root orientation="vertical">
			<NavigationMenu.List>
				<NavigationMenu.Item>
					<NavigationMenu.Link
						href="#themes"
						prefix={ <Icon icon={ archive } size={ 24 } /> }
						suffix="12"
					>
						<NavigationMenu.ItemLabel>
							Themes
						</NavigationMenu.ItemLabel>
						<NavigationMenu.ItemDescription>
							Choose how the site looks.
						</NavigationMenu.ItemDescription>
					</NavigationMenu.Link>
				</NavigationMenu.Item>
				<NavigationMenu.Item>
					<NavigationMenu.Link
						href="#patterns"
						prefix={ <Icon icon={ archive } size={ 24 } /> }
						shortcut={ SHORTCUT }
					>
						Patterns
					</NavigationMenu.Link>
				</NavigationMenu.Item>
				<NavigationMenu.Item>
					<NavigationMenu.Link
						href="https://wordpress.org"
						openInNewTab
					>
						WordPress.org
					</NavigationMenu.Link>
				</NavigationMenu.Item>
			</NavigationMenu.List>
		</NavigationMenu.Root>
	);
}

export const FlatNavigation: Story = {
	render: function Render() {
		const RouterLink = forwardRef<
			HTMLAnchorElement,
			React.ComponentProps< 'a' >
		>( function RouterLink( { children, ...props }, ref ) {
			return (
				<a ref={ ref } data-router-link="true" { ...props }>
					{ children }
				</a>
			);
		} );

		return (
			<NavigationMenu.Root aria-label="Editor">
				<NavigationMenu.List>
					<NavigationMenu.Item>
						<NavigationMenu.Link href="#dashboard">
							Dashboard
						</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item>
						<NavigationMenu.Link href="#posts" active>
							Posts
						</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item>
						<NavigationMenu.Link
							href="#pages"
							render={ <RouterLink /> }
						>
							Pages
						</NavigationMenu.Link>
					</NavigationMenu.Item>
				</NavigationMenu.List>
			</NavigationMenu.Root>
		);
	},
};

export const FlyoutNavigation: Story = {
	render: function Render() {
		return (
			<NavigationMenu.Root aria-label="Editor">
				<NavigationMenu.List>
					<NavigationMenu.Item>
						<NavigationMenu.Link href="#dashboard">
							Dashboard
						</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item value="appearance">
						<NavigationMenu.Trigger>
							Appearance
						</NavigationMenu.Trigger>
						<NavigationMenu.Content>
							<AppearanceLinks />
						</NavigationMenu.Content>
					</NavigationMenu.Item>
					<NavigationMenu.Item>
						<NavigationMenu.Link href="#settings">
							Settings
						</NavigationMenu.Link>
					</NavigationMenu.Item>
				</NavigationMenu.List>
				<DefaultPopup arrow />
			</NavigationMenu.Root>
		);
	},
};

function TwoLevelNavigation() {
	return (
		<NavigationMenu.Root aria-label="Editor">
			<NavigationMenu.List>
				<NavigationMenu.Item value="appearance">
					<NavigationMenu.Trigger>Appearance</NavigationMenu.Trigger>
					<NavigationMenu.Content>
						<NavigationMenu.Root orientation="vertical">
							<NavigationMenu.List>
								<NavigationMenu.Item>
									<NavigationMenu.Link href="#themes">
										Themes
									</NavigationMenu.Link>
								</NavigationMenu.Item>
								<NavigationMenu.Item value="design">
									<NavigationMenu.Trigger>
										Design
									</NavigationMenu.Trigger>
									<NavigationMenu.Content>
										<AppearanceLinks />
									</NavigationMenu.Content>
								</NavigationMenu.Item>
							</NavigationMenu.List>
							<DefaultPopup />
						</NavigationMenu.Root>
					</NavigationMenu.Content>
				</NavigationMenu.Item>
			</NavigationMenu.List>
			<DefaultPopup />
		</NavigationMenu.Root>
	);
}

export const TwoLevelNestedFlyout: Story = {
	render: function Render() {
		return <TwoLevelNavigation />;
	},
};

export const ControlledRoot: Story = {
	render: function Render() {
		const [ value, setValue ] = useState< string | null >( 'appearance' );

		return (
			<NavigationMenu.Root
				aria-label="Editor"
				value={ value }
				onValueChange={ setValue }
			>
				<NavigationMenu.List>
					<NavigationMenu.Item value="appearance">
						<NavigationMenu.Trigger>
							Appearance
						</NavigationMenu.Trigger>
						<NavigationMenu.Content>
							<AppearanceLinks />
						</NavigationMenu.Content>
					</NavigationMenu.Item>
				</NavigationMenu.List>
				<DefaultPopup />
			</NavigationMenu.Root>
		);
	},
};

export const CustomPositioning: Story = {
	render: function Render() {
		return (
			<NavigationMenu.Root aria-label="Editor">
				<NavigationMenu.List>
					<NavigationMenu.Item value="appearance">
						<NavigationMenu.Trigger>
							Appearance
						</NavigationMenu.Trigger>
						<NavigationMenu.Content>
							<AppearanceLinks />
						</NavigationMenu.Content>
					</NavigationMenu.Item>
				</NavigationMenu.List>
				<NavigationMenu.Popup
					positioner={
						<NavigationMenu.Positioner
							side="top"
							align="center"
							sideOffset={ 12 }
						/>
					}
				>
					<NavigationMenu.Arrow />
					<NavigationMenu.Viewport />
				</NavigationMenu.Popup>
			</NavigationMenu.Root>
		);
	},
};

export const LongContentAndOverflow: Story = {
	render: function Render() {
		return (
			<div style={ { maxWidth: '320px' } }>
				<NavigationMenu.Root aria-label="Editor">
					<NavigationMenu.List>
						{ Array.from( { length: 8 }, ( _, index ) => (
							<NavigationMenu.Item key={ index }>
								<NavigationMenu.Link
									href={ `#page-${ index }` }
								>
									{ index === 3
										? 'A deliberately long translated navigation destination'
										: `Destination ${ index + 1 }` }
								</NavigationMenu.Link>
							</NavigationMenu.Item>
						) ) }
					</NavigationMenu.List>
				</NavigationMenu.Root>
			</div>
		);
	},
};

export const RightToLeft: Story = {
	render: function Render() {
		return (
			<DirectionProvider direction="rtl">
				<div dir="rtl">
					<TwoLevelNavigation />
				</div>
			</DirectionProvider>
		);
	},
};
