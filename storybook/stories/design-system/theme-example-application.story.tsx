import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { privateApis as themeApis } from '@wordpress/theme';
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';
import {
	Badge,
	Button,
	Card,
	Link,
	Notice,
	Stack,
	Tabs,
	Text,
} from '@wordpress/ui';

const { unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
	'@wordpress/theme'
);

const { ThemeProvider } = unlock( themeApis );

const sidebarNavItems = [
	'Dashboard',
	'Posts',
	'Pages',
	'Comments',
	'Appearance',
	'Settings',
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
 * A mock application page demonstrating how `ThemeProvider` affects multiple
 * `@wordpress/ui` components in concert. Use the inline controls to adjust
 * the `primary` seed color, `bg` seed color, and `density`, and observe how
 * every surface, text element, and interactive control adapts accordingly.
 */
export const ExampleApplication: StoryObj< typeof ThemeProvider > = {
	render: () => {
		const [ primary, setPrimary ] = useState< string | undefined >();
		const [ bg, setBg ] = useState< string | undefined >();
		const [ density, setDensity ] = useState<
			'default' | 'compact' | 'comfortable' | undefined
		>();

		return (
			<div>
				<div
					style={ {
						display: 'flex',
						alignItems: 'center',
						gap: '16px',
						padding: '12px 16px',
						marginBlockEnd: '16px',
						borderRadius: '8px',
						background: '#f0f0f0',
						fontSize: '13px',
						flexWrap: 'wrap',
					} }
				>
					{ /* eslint-disable jsx-a11y/label-has-associated-control */ }
					<label
						style={ {
							display: 'inline-flex',
							alignItems: 'center',
							gap: '6px',
						} }
					>
						Primary
						<input
							type="color"
							value={ primary ?? '#3858e9' }
							onChange={ ( e ) => setPrimary( e.target.value ) }
						/>
					</label>
					<label
						style={ {
							display: 'inline-flex',
							alignItems: 'center',
							gap: '6px',
						} }
					>
						Background
						<input
							type="color"
							value={ bg ?? '#ffffff' }
							onChange={ ( e ) => setBg( e.target.value ) }
						/>
					</label>
					<label
						style={ {
							display: 'inline-flex',
							alignItems: 'center',
							gap: '6px',
						} }
					>
						Density
						<select
							value={ density ?? '' }
							onChange={ ( e ) =>
								setDensity(
									( e.target.value || undefined ) as
										| 'default'
										| 'compact'
										| 'comfortable'
										| undefined
								)
							}
						>
							<option value="">Default</option>
							<option value="compact">Compact</option>
							<option value="comfortable">Comfortable</option>
						</select>
					</label>
					{ /* eslint-enable jsx-a11y/label-has-associated-control */ }
				</div>
				<ThemeProvider
					color={ { primary, bg } }
					density={ density }
					isRoot
				>
					<div
						style={ {
							display: 'grid',
							gridTemplateColumns: '200px 1fr',
							minHeight: '500px',
							color: 'var(--wpds-color-fg-content-neutral)',
						} }
					>
						{ /* Sidebar */ }
						<div
							style={ {
								backgroundColor:
									'var(--wpds-color-bg-surface-neutral-weak)',
								padding:
									'var(--wpds-dimension-padding-xl) var(--wpds-dimension-padding-lg)',
							} }
						>
							{ /* eslint-disable jsx-a11y/heading-has-content */ }
							<Text
								variant="heading-sm"
								render={ <h2 /> }
								style={ {
									marginBlockEnd:
										'var(--wpds-dimension-gap-xl)',
								} }
							>
								My App
							</Text>
							{ /* eslint-enable jsx-a11y/heading-has-content */ }
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
						</div>

						{ /* Page content (header + content area) */ }
						<div
							style={ {
								backgroundColor:
									'var(--wpds-color-bg-surface-neutral-weak)',
								padding: 'var(--wpds-dimension-padding-lg)',
							} }
						>
							<div
								style={ {
									display: 'flex',
									flexDirection: 'column',
									borderRadius:
										'var(--wpds-border-radius-lg)',
									border: '1px solid var(--wpds-color-stroke-surface-neutral-weak)',
									overflow: 'hidden',
									height: '100%',
								} }
							>
								{ /* Header */ }
								<div
									style={ {
										backgroundColor:
											'var(--wpds-color-bg-surface-neutral-strong)',
										padding:
											'var(--wpds-dimension-padding-xl)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										gap: 'var(--wpds-dimension-gap-lg)',
										borderBlockEnd:
											'1px solid var(--wpds-color-stroke-surface-neutral-weak)',
									} }
								>
									<div
										style={ {
											display: 'flex',
											alignItems: 'center',
											gap: 'var(--wpds-dimension-gap-md)',
										} }
									>
										{ /* eslint-disable jsx-a11y/heading-has-content */ }
										<Text
											variant="heading-lg"
											render={ <h1 /> }
											style={ {
												margin: 0,
											} }
										>
											Settings
										</Text>
										{ /* eslint-enable jsx-a11y/heading-has-content */ }
										<Badge intent="informational">
											Beta
										</Badge>
									</div>
									<Button
										variant="solid"
										tone="brand"
										size="compact"
									>
										Save changes
									</Button>
								</div>

								{ /* Content area */ }
								<div
									style={ {
										backgroundColor:
											'var(--wpds-color-bg-surface-neutral)',
										padding:
											'var(--wpds-dimension-padding-xl)',
										flexGrow: 1,
									} }
								>
									<Stack
										direction="column"
										gap="xl"
										style={ {
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
										<Card.Root>
											<Card.Header>
												<Card.Title>General</Card.Title>
											</Card.Header>
											<Card.Content>
												<Stack
													direction="column"
													gap="md"
												>
													<Text>
														Configure the basic
														settings for your site.
														You can update your{ ' ' }
														<Link href="#">
															site title
														</Link>
														, tagline, and{ ' ' }
														<Link href="#">
															admin email address
														</Link>{ ' ' }
														at any time.
													</Text>
													<Text>
														For more advanced
														options, visit the{ ' ' }
														<Link href="#">
															developer
															documentation
														</Link>
														.
													</Text>
												</Stack>
											</Card.Content>
										</Card.Root>

										{ /* Card 2: Display */ }
										<Card.Root>
											<Card.Header>
												<Card.Title>Display</Card.Title>
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
														<Text
															style={ {
																paddingBlockStart:
																	'var(--wpds-dimension-padding-lg)',
															} }
														>
															Control how your
															site looks to
															visitors. Adjust{ ' ' }
															<Link href="#">
																typography
															</Link>
															,{ ' ' }
															<Link href="#">
																colors
															</Link>
															, and spacing to
															match your brand.
														</Text>
													</Tabs.Panel>
													<Tabs.Panel value="layout">
														<Text
															style={ {
																paddingBlockStart:
																	'var(--wpds-dimension-padding-lg)',
															} }
														>
															Choose a layout
															structure for your
															pages. Options
															include full-width,
															boxed, and{ ' ' }
															<Link href="#">
																custom layouts
															</Link>
															.
														</Text>
													</Tabs.Panel>
													<Tabs.Panel value="accessibility">
														<Text
															style={ {
																paddingBlockStart:
																	'var(--wpds-dimension-padding-lg)',
															} }
														>
															Review your
															site&apos;s{ ' ' }
															<Link href="#">
																accessibility
																settings
															</Link>{ ' ' }
															to ensure it meets
															WCAG guidelines.
														</Text>
													</Tabs.Panel>
												</Tabs.Root>
											</Card.Content>
										</Card.Root>
									</Stack>
								</div>
							</div>
						</div>
					</div>
				</ThemeProvider>
			</div>
		);
	},
	parameters: {
		controls: { disable: true },
	},
};
