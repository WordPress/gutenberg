import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { useId, useState } from '@wordpress/element';
import { wordpress } from '@wordpress/icons';
import { ThemeProvider } from '@wordpress/theme';
import {
	Badge,
	Button,
	Card,
	Dialog,
	Icon,
	InputControl,
	Link,
	Menu,
	Notice,
	SelectControl,
	Stack,
	Tabs,
	Text,
} from '@wordpress/ui';
import { withRouter } from '../../decorators/with-router';
import { getDesignSystemThemeSettings } from '../../decorators/with-design-system-theme';

const SIDEBAR_THEME_PRESETS = [
	{
		id: 'fresh',
		title: 'Fresh',
		colors: { primary: '#3858e9', background: '#25292b' },
	},
	{
		id: 'blue',
		title: 'Blue',
		colors: { primary: '#437aa8', background: '#3876a8' },
	},
	{
		id: 'ectoplasm',
		title: 'Ectoplasm',
		colors: { primary: '#646c3e', background: '#4f386e' },
	},
] as const;

type SidebarThemeId = ( typeof SIDEBAR_THEME_PRESETS )[ number ][ 'id' ];

function getSidebarThemePreset( value: unknown ) {
	return (
		SIDEBAR_THEME_PRESETS.find( ( preset ) => preset.id === value ) ??
		SIDEBAR_THEME_PRESETS[ 0 ]
	);
}

function SidebarThemeControls( {
	selectedTheme,
	onSelectTheme,
}: {
	selectedTheme: SidebarThemeId;
	onSelectTheme: ( theme: SidebarThemeId ) => void;
} ) {
	return (
		<Stack
			direction="row"
			gap="sm"
			align="center"
			justify="space-between"
			style={ {
				flexWrap: 'wrap',
				marginBlockEnd: 'var(--wpds-dimension-gap-md)',
			} }
		>
			<Text variant="heading-sm">Sidebar theme</Text>
			<Stack
				direction="row"
				gap="xs"
				render={ <div role="group" aria-label="Sidebar theme" /> }
			>
				{ SIDEBAR_THEME_PRESETS.map( ( preset ) => (
					<Button
						key={ preset.id }
						size="compact"
						variant={
							selectedTheme === preset.id ? 'solid' : 'outline'
						}
						aria-pressed={ selectedTheme === preset.id }
						onClick={ () => onSelectTheme( preset.id ) }
						style={ { gap: 'var(--wpds-dimension-gap-xs)' } }
					>
						<span
							aria-hidden="true"
							style={ {
								display: 'flex',
								isolation: 'isolate',
							} }
						>
							{ Object.values( preset.colors ).map(
								( color, index ) => (
									<span
										key={ color }
										style={ {
											backgroundColor: color,
											border: 'var(--wpds-border-width-xs) solid var(--wpds-color-stroke-surface-neutral)',
											borderRadius: '50%',
											boxSizing: 'border-box',
											display: 'block',
											height: 'var(--wpds-dimension-size-xs)',
											marginInlineStart:
												index === 0 ? 0 : '-4px',
											width: 'var(--wpds-dimension-size-xs)',
											zIndex: -index,
										} }
									/>
								)
							) }
						</span>
						{ preset.title }
					</Button>
				) ) }
			</Stack>
		</Stack>
	);
}

const sidebarNavItems = [
	'Dashboard',
	'Posts',
	'Pages',
	'Comments',
	'Appearance',
	'Settings',
];

const siteLanguageOptions = [
	{ value: 'en-US', label: 'English (United States)' },
	{ value: 'en-GB', label: 'English (United Kingdom)' },
	{ value: 'fr-FR', label: 'Français' },
	{ value: 'de-DE', label: 'Deutsch' },
	{ value: 'ja', label: '日本語' },
];

const meta: Meta< typeof ThemeProvider > = {
	title: 'Design System/Theme/Theme Provider/Example Application',
	component: ThemeProvider,
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'hidden' } },
	},
};
export default meta;

/**
 * A mock application demonstrating nested `ThemeProvider` components. The
 * application shell uses its own color preset, while the main content
 * explicitly reapplies the root settings from the Storybook Theme toolbar.
 */
export const ExampleApplication: StoryObj< typeof ThemeProvider > = {
	render: ( _, context ) => {
		const [ isSiteDetailsOpen, setIsSiteDetailsOpen ] = useState( false );
		const [ sidebarThemeId, setSidebarThemeId ] =
			useState< SidebarThemeId >( SIDEBAR_THEME_PRESETS[ 0 ].id );
		const generalSettingsId = useId();
		const displaySettingsId = useId();
		const rootThemeSettings = getDesignSystemThemeSettings(
			context.globals
		);
		const sidebarTheme = getSidebarThemePreset( sidebarThemeId );

		return (
			<div>
				<SidebarThemeControls
					selectedTheme={ sidebarTheme.id }
					onSelectTheme={ setSidebarThemeId }
				/>
				<ThemeProvider color={ sidebarTheme.colors }>
					<div
						style={ {
							display: 'grid',
							gridTemplateColumns: '200px 1fr',
							minHeight: '500px',
							color: 'var(--wpds-color-foreground-content-neutral)',
							borderRadius: 'var(--wpds-border-radius-xl)',
							border: 'var(--wpds-border-width-xs) solid var(--wpds-color-stroke-surface-neutral-weak)',
							overflow: 'hidden',
						} }
					>
						{ /* Sidebar */ }
						<Stack
							direction="column"
							gap="xl"
							style={ {
								backgroundColor:
									'var(--wpds-color-background-surface-neutral-weak)',
								padding:
									'var(--wpds-dimension-padding-xl) var(--wpds-dimension-padding-lg)',
								borderInlineEnd:
									'var(--wpds-border-width-xs) solid var(--wpds-color-stroke-surface-neutral-weak)',
							} }
						>
							<Text variant="heading-sm" render={ <h2 /> }>
								My App
							</Text>
							<nav>
								<Stack
									direction="column"
									gap="xs"
									render={ <ul /> }
									style={ {
										listStyle: 'none',
										margin: 0,
										padding: 0,
									} }
								>
									{ sidebarNavItems.map( ( item ) => (
										<li key={ item }>
											<Text variant="body-md">
												{ item }
											</Text>
										</li>
									) ) }
								</Stack>
							</nav>
							<div>
								<Dialog.Root
									open={ isSiteDetailsOpen }
									onOpenChange={ setIsSiteDetailsOpen }
								>
									<Menu.Root>
										<Menu.Trigger
											render={
												<Button
													size="compact"
													variant="outline"
													tone="neutral"
													style={ {
														justifyContent:
															'flex-start',
														width: '100%',
													} }
												/>
											}
										>
											Site actions
										</Menu.Trigger>
										<Menu.Popup>
											<Menu.LinkItem
												href={ `#${ generalSettingsId }` }
											>
												<Menu.ItemLabel>
													General settings
												</Menu.ItemLabel>
											</Menu.LinkItem>
											<Menu.LinkItem
												href={ `#${ displaySettingsId }` }
											>
												<Menu.ItemLabel>
													Display settings
												</Menu.ItemLabel>
											</Menu.LinkItem>
											<Menu.Separator />
											<Menu.Item
												onClick={ () =>
													setIsSiteDetailsOpen( true )
												}
											>
												<Menu.ItemLabel>
													View site details…
												</Menu.ItemLabel>
											</Menu.Item>
										</Menu.Popup>
									</Menu.Root>
									<Dialog.Popup size="small">
										<Dialog.Header>
											<Dialog.Title>
												Site details
											</Dialog.Title>
											<Dialog.CloseIcon />
										</Dialog.Header>
										<Dialog.Content>
											<Stack direction="column" gap="sm">
												<Dialog.Description>
													This sample dialog shows
													information about the
													current site.
												</Dialog.Description>
												<Text>
													<strong>Site title:</strong>{ ' ' }
													My WordPress site
												</Text>
												<Text>
													<strong>Language:</strong>{ ' ' }
													English (United States)
												</Text>
											</Stack>
										</Dialog.Content>
										<Dialog.Footer>
											<Dialog.Action>Done</Dialog.Action>
										</Dialog.Footer>
									</Dialog.Popup>
								</Dialog.Root>
							</div>
						</Stack>

						<Page
							ariaLabel="Level 1 breadcrumb"
							visual={ <Icon icon={ wordpress } size={ 24 } /> }
							subTitle="All of the subtitle text you need goes here."
							breadcrumbs={
								<Breadcrumbs
									items={ [
										{
											label: 'Root breadcrumb',
											to: '/connectors',
										},
										{ label: 'Level 1 breadcrumb' },
									] }
								/>
							}
							badges={
								<Badge intent="informational">Status</Badge>
							}
							actions={
								<>
									<Button size="compact" variant="solid">
										Save
									</Button>
								</>
							}
							showSidebarToggle={ false }
						>
							<div
								style={ {
									display: 'grid',
									flex: 1,
								} }
							>
								<ThemeProvider { ...rootThemeSettings }>
									<div
										style={ {
											boxSizing: 'border-box',
											backgroundColor:
												'var(--wpds-color-background-surface-neutral)',
											color: 'var(--wpds-color-foreground-content-neutral)',
											height: '100%',
											padding:
												'var(--wpds-dimension-padding-lg) var(--wpds-dimension-padding-2xl)',
										} }
									>
										<Stack
											direction="column"
											gap="lg"
											style={ {
												width: '100%',
												maxWidth: '640px',
												marginInline: 'auto',
											} }
										>
											<Notice.Root intent="info">
												<Notice.Title>
													Welcome to your new site
												</Notice.Title>
												<Notice.Description>
													Complete the steps below to
													finish setting up.
												</Notice.Description>
											</Notice.Root>

											{ /* Card 1: General */ }
											<Card.Root id={ generalSettingsId }>
												<Card.Header>
													<Card.Title>
														General
													</Card.Title>
												</Card.Header>
												<Card.Content>
													<Stack
														direction="column"
														gap="md"
													>
														<Text>
															Configure the basic
															settings for your
															site. The fields
															below adopt the
															corner radius preset
															alongside cards,
															buttons, and other
															surfaces.
														</Text>
														<InputControl
															label="Site title"
															placeholder="My WordPress site"
															defaultValue="My WordPress site"
														/>
														<InputControl
															label="Tagline"
															description="A short phrase shown below the site title."
															placeholder="Just another WordPress site"
														/>
														<InputControl
															label="Admin email address"
															type="email"
															placeholder="you@example.com"
															defaultValue="admin@example.com"
														/>
														<SelectControl
															label="Site language"
															description="The default language for the site interface."
															items={
																siteLanguageOptions
															}
															defaultValue={
																siteLanguageOptions[ 0 ]
															}
														/>
														<Stack
															direction="row"
															style={ {
																justifyContent:
																	'flex-end',
															} }
														>
															<Button>
																Save
															</Button>
														</Stack>
													</Stack>
												</Card.Content>
											</Card.Root>

											{ /* Card 2: Display */ }
											<Card.Root id={ displaySettingsId }>
												<Card.Header>
													<Card.Title>
														Display
													</Card.Title>
												</Card.Header>
												<Card.Content>
													<Tabs.Root defaultValue="appearance">
														<Tabs.List variant="minimal">
															<Tabs.Tab value="appearance">
																Appearance
															</Tabs.Tab>
															<Tabs.Tab value="layout">
																Layout
															</Tabs.Tab>
															<Tabs.Tab value="accessibility">
																Accessibility
															</Tabs.Tab>
														</Tabs.List>
														<Tabs.Panel value="appearance">
															<Stack
																direction="column"
																gap="md"
																style={ {
																	paddingBlockStart:
																		'var(--wpds-dimension-padding-md)',
																} }
															>
																<Text>
																	Control how
																	your site
																	looks to
																	visitors.
																	Adjust{ ' ' }
																	<Link href="#">
																		typography
																	</Link>
																	,{ ' ' }
																	<Link href="#">
																		colors
																	</Link>
																	, and
																	spacing to
																	match your
																	brand.
																</Text>
															</Stack>
														</Tabs.Panel>
														<Tabs.Panel value="layout">
															<Stack
																direction="column"
																gap="md"
																style={ {
																	paddingBlockStart:
																		'var(--wpds-dimension-padding-md)',
																} }
															>
																<Text>
																	Choose a
																	layout
																	structure
																	for your
																	pages.
																	Options
																	include
																	full-width,
																	boxed, and{ ' ' }
																	<Link href="#">
																		custom
																		layouts
																	</Link>
																	.
																</Text>
															</Stack>
														</Tabs.Panel>
														<Tabs.Panel value="accessibility">
															<Stack
																direction="column"
																gap="md"
																style={ {
																	paddingBlockStart:
																		'var(--wpds-dimension-padding-md)',
																} }
															>
																<Text>
																	Review your
																	site&apos;s{ ' ' }
																	<Link href="#">
																		accessibility
																		settings
																	</Link>{ ' ' }
																	to ensure it
																	meets WCAG
																	guidelines.
																</Text>
															</Stack>
														</Tabs.Panel>
													</Tabs.Root>
												</Card.Content>
											</Card.Root>
										</Stack>
									</div>
								</ThemeProvider>
							</div>
						</Page>
					</div>
				</ThemeProvider>
			</div>
		);
	},
	decorators: [ withRouter ],
	parameters: {
		controls: { disable: true },
	},
};
