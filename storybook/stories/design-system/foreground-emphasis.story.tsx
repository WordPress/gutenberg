import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExternalLink, Notice, TabPanel } from '@wordpress/components';
import { cog, pencil, trash } from '@wordpress/icons';
import { ThemeProvider } from '@wordpress/theme';
import {
	Button,
	IconButton,
	Link,
	Notice as UINotice,
	Stack,
	Tabs,
	Text,
	Tooltip,
} from '@wordpress/ui';

const meta: Meta = {
	title: 'Design System/Theme/Foreground Emphasis',
	parameters: { layout: 'padded' },
};
export default meta;

const themes = [
	{ name: 'Light', background: '#fcfcfc', primary: '#3858e9' },
	{ name: 'Dark', background: '#1e1e1e', primary: '#3858e9' },
	{ name: 'Ectoplasm', background: '#4f386e', primary: '#646c3e' },
];

const noticeIntents = [ 'info', 'success', 'warning', 'error' ] as const;

/**
 * Compare content emphasis and interaction cues across light, dark, and tinted
 * surfaces. Hover the controls and move between them with the keyboard.
 */
export const Comparison: StoryObj = {
	render: () => (
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
				gap: 'var(--wpds-dimension-gap-lg)',
			} }
		>
			{ themes.map( ( { name, ...color } ) => (
				<ThemeProvider key={ name } color={ color }>
					<Stack
						direction="column"
						gap="lg"
						style={ {
							padding: 'var(--wpds-dimension-padding-lg)',
							color: 'var(--wpds-color-foreground-content-neutral)',
							backgroundColor:
								'var(--wpds-color-background-surface-neutral)',
							borderRadius: 'var(--wpds-border-radius-lg)',
						} }
					>
						<Stack direction="column" gap="sm">
							<Text variant="heading-xl" render={ <h2 /> }>
								{ name }
							</Text>
							<Text render={ <p /> }>
								Body text uses normal emphasis. Headings use
								strong emphasis.
							</Text>
							<Text
								variant="body-sm"
								style={ {
									color: 'var(--wpds-color-foreground-content-neutral-weak)',
								} }
							>
								Supporting text uses weak emphasis.
							</Text>
						</Stack>
						<Tooltip.Provider>
							<Stack direction="row" gap="sm">
								<IconButton
									variant="minimal"
									tone="neutral"
									icon={ pencil }
									label="Edit"
								/>
								<IconButton
									variant="minimal"
									icon={ cog }
									label="Settings"
								/>
								<IconButton
									variant="minimal"
									tone="neutral"
									icon={ trash }
									label="Delete"
									disabled
								/>
							</Stack>
						</Tooltip.Provider>
						<Stack direction="row" gap="sm">
							<Button variant="minimal" tone="neutral">
								Edit
							</Button>
							<Button variant="minimal" tone="neutral" disabled>
								Disabled
							</Button>
						</Stack>
						<Text render={ <p /> }>
							<Link href="#" tone="neutral">
								Neutral link
							</Link>{ ' ' }
							and <Link href="#">brand link</Link>
						</Text>
						{ ( [ 'default', 'minimal' ] as const ).map(
							( variant ) => (
								<Tabs.Root
									key={ variant }
									defaultValue="content"
								>
									<Tabs.List
										variant={ variant }
										aria-label={ `${ name } ${ variant } tabs` }
									>
										<Tabs.Tab value="content">
											Content
										</Tabs.Tab>
										<Tabs.Tab value="settings">
											Settings
										</Tabs.Tab>
										<Tabs.Tab value="disabled" disabled>
											Disabled
										</Tabs.Tab>
									</Tabs.List>
									<Tabs.Panel value="content">
										<Text>Content panel</Text>
									</Tabs.Panel>
									<Tabs.Panel value="settings">
										<Text>Settings panel</Text>
									</Tabs.Panel>
									<Tabs.Panel value="disabled">
										<Text>Disabled panel</Text>
									</Tabs.Panel>
								</Tabs.Root>
							)
						) }
						<Stack direction="column" gap="sm">
							<Text variant="heading-sm">Notices</Text>
							{ noticeIntents.map( ( intent ) => (
								<UINotice.Root key={ intent } intent={ intent }>
									<UINotice.Description>
										{ intent } notice
									</UINotice.Description>
									<UINotice.CloseIconButton />
								</UINotice.Root>
							) ) }
						</Stack>
						<Stack direction="column" gap="sm">
							<Text variant="heading-sm">Legacy components</Text>
							<TabPanel
								tabs={ [
									{ name: 'content', title: 'Content' },
									{ name: 'settings', title: 'Settings' },
									{
										name: 'disabled',
										title: 'Disabled',
										disabled: true,
									},
								] }
							>
								{ ( tab ) => <Text>{ tab.title } panel</Text> }
							</TabPanel>
							<ExternalLink href="https://wordpress.org">
								Visit WordPress.org
							</ExternalLink>
							{ noticeIntents.map( ( status ) => (
								<Notice
									key={ status }
									status={ status }
									onRemove={ () => {} }
								>
									{ status } notice
								</Notice>
							) ) }
						</Stack>
					</Stack>
				</ThemeProvider>
			) ) }
		</div>
	),
};

/**
 * Resize the container to compare painted tab padding with actual overflow.
 */
export const MinimalTabsOverflow: StoryObj = {
	render: () => (
		<div
			style={ {
				width: 140,
				padding: 16,
				resize: 'horizontal',
				overflow: 'auto',
				boxSizing: 'content-box',
			} }
		>
			<ThemeProvider
				color={ {
					background: themes[ 0 ].background,
					primary: themes[ 0 ].primary,
				} }
			>
				<Tabs.Root defaultValue="Content">
					<Tabs.List
						variant="minimal"
						aria-label="Resizable minimal tabs"
						style={ { maxWidth: '100%' } }
					>
						{ [ 'Content', 'Settings', 'Preview' ].map(
							( label ) => (
								<Tabs.Tab key={ label } value={ label }>
									{ label }
								</Tabs.Tab>
							)
						) }
					</Tabs.List>
					{ [ 'Content', 'Settings', 'Preview' ].map( ( label ) => (
						<Tabs.Panel key={ label } value={ label }>
							<Text>{ label } panel</Text>
						</Tabs.Panel>
					) ) }
				</Tabs.Root>
			</ThemeProvider>
		</div>
	),
};
