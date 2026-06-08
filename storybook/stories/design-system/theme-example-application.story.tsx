import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { useState } from '@wordpress/element';
import { wordpress } from '@wordpress/icons';
import { privateApis as themeApis } from '@wordpress/theme';
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';
import {
	Badge,
	Button,
	Card,
	Icon,
	Link,
	Notice,
	Stack,
	Tabs,
	Text,
} from '@wordpress/ui';

import { withRouter } from '../../decorators/with-router';

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
 * A mock application page demonstrating how `ThemeProvider` affects
 * `@wordpress/ui` and `@wordpress/admin-ui` components in concert. Use the inline controls to adjust
 * the `primary` and `bg` seed colors, and observe how every surface, text
 * element, and interactive control adapts accordingly.
 */
export const ExampleApplication: StoryObj< typeof ThemeProvider > = {
	render: () => {
		const [ primary, setPrimary ] = useState< string | undefined >();
		const [ bg, setBg ] = useState< string | undefined >();

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
					{ /* eslint-enable jsx-a11y/label-has-associated-control */ }
				</div>
				<ThemeProvider color={ { primary, bg } } isRoot>
					<div
						style={ {
							display: 'grid',
							gridTemplateColumns: '200px 1fr',
							minHeight: '500px',
							color: 'var(--wpds-color-fg-content-neutral)',
							borderRadius: 'var(--wpds-border-radius-lg)',
							border: 'var(--wpds-border-width-xs) solid var(--wpds-color-stroke-surface-neutral-weak)',
							overflow: 'hidden',
						} }
					>
						{ /* Sidebar */ }
						<div
							style={ {
								backgroundColor:
									'var(--wpds-color-bg-surface-neutral-weak)',
								padding:
									'var(--wpds-dimension-padding-xl) var(--wpds-dimension-padding-lg)',
								borderInlineEnd:
									'var(--wpds-border-width-xs) solid var(--wpds-color-stroke-surface-neutral-weak)',
							} }
						>
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
							hasPadding
						>
							<Stack
								direction="column"
								gap="lg"
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
										Complete the steps below to finish
										setting up.
									</Notice.Description>
								</Notice.Root>

								{ /* Card 1: General */ }
								<Card.Root>
									<Card.Header>
										<Card.Title>General</Card.Title>
									</Card.Header>
									<Card.Content>
										<Stack direction="column" gap="md">
											<Text>
												Configure the basic settings for
												your site. You can update your{ ' ' }
												<Link href="#">site title</Link>
												, tagline, and{ ' ' }
												<Link href="#">
													admin email address
												</Link>{ ' ' }
												at any time.
											</Text>
											<Text>
												For more advanced options, visit
												the{ ' ' }
												<Link href="#">
													developer documentation
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
												<Stack
													direction="column"
													gap="md"
													style={ {
														paddingBlockStart:
															'var(--wpds-dimension-padding-md)',
													} }
												>
													<Text>
														Control how your site
														looks to visitors.
														Adjust{ ' ' }
														<Link href="#">
															typography
														</Link>
														,{ ' ' }
														<Link href="#">
															colors
														</Link>
														, and spacing to match
														your brand.
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
														Choose a layout
														structure for your
														pages. Options include
														full-width, boxed, and{ ' ' }
														<Link href="#">
															custom layouts
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
														Review your site&apos;s{ ' ' }
														<Link href="#">
															accessibility
															settings
														</Link>{ ' ' }
														to ensure it meets WCAG
														guidelines.
													</Text>
												</Stack>
											</Tabs.Panel>
										</Tabs.Root>
									</Card.Content>
								</Card.Root>
							</Stack>
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
