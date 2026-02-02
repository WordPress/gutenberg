import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, cloneElement } from '@wordpress/element';
import { link, more, wordpress } from '@wordpress/icons';
import { Tabs, Tooltip } from '../..';

const meta: Meta< typeof Tabs.Root > = {
	title: 'Design System/Components/Tabs',
	component: Tabs.Root,
	subcomponents: {
		'Tabs.List': Tabs.List,
		'Tabs.Tab': Tabs.Tab,
		'Tabs.Panel': Tabs.Panel,
	},
};
export default meta;

const ThemedParagraph = ( { children }: { children: React.ReactNode } ) => {
	return (
		<p style={ { color: 'var( --wpds-color-fg-content-neutral )' } }>
			{ children }
		</p>
	);
};

export const Default: StoryObj< typeof Tabs.Root > = {
	args: {
		defaultValue: 'tab1',
		children: (
			<>
				<Tabs.List>
					<Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
					<Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
					<Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
				</Tabs.List>
				<Tabs.Panel value="tab1">
					<ThemedParagraph>Selected tab: Tab 1</ThemedParagraph>
				</Tabs.Panel>
				<Tabs.Panel value="tab2">
					<ThemedParagraph>Selected tab: Tab 2</ThemedParagraph>
				</Tabs.Panel>
				<Tabs.Panel value="tab3">
					<ThemedParagraph>Selected tab: Tab 3</ThemedParagraph>
				</Tabs.Panel>
			</>
		),
	},
};

export const Minimal: StoryObj< typeof Tabs.Root > = {
	args: {
		...Default.args,
		children: (
			<>
				<Tabs.List variant="minimal">
					<Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
					<Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
					<Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
				</Tabs.List>
				<Tabs.Panel value="tab1">
					<ThemedParagraph>Selected tab: Tab 1</ThemedParagraph>
				</Tabs.Panel>
				<Tabs.Panel value="tab2">
					<ThemedParagraph>Selected tab: Tab 2</ThemedParagraph>
				</Tabs.Panel>
				<Tabs.Panel value="tab3">
					<ThemedParagraph>Selected tab: Tab 3</ThemedParagraph>
				</Tabs.Panel>
			</>
		),
	},
};

export const SizeAndOverflowPlayground: StoryObj< typeof Tabs.Root > = {
	render: function SizeAndOverflowPlayground( props ) {
		const [ fullWidth, setFullWidth ] = useState( false );
		return (
			<div>
				<div
					style={ {
						maxWidth: '40rem',
						marginBottom: '1rem',
						color: 'var( --wpds-color-fg-content-neutral )',
					} }
				>
					<p>
						This story helps understand how the TabList component
						behaves under different conditions. The container below
						(with the dotted red border) can be horizontally
						resized, and it has a bit of padding to be out of the
						way of the TabList.
					</p>
					<p>
						The button will toggle between full width (adding{ ' ' }
						<code>width: 100%</code>) and the default width.
					</p>
					<p>Try the following:</p>
					<ul>
						<li>
							<strong>Small container</strong> that causes tabs to
							overflow with scroll.
						</li>
						<li>
							<strong>Large container</strong> that exceeds the
							normal width of the tabs.
							<ul>
								<li>
									<strong>
										With <code>width: 100%</code>
									</strong>{ ' ' }
									set on the TabList (tabs fill up the space).
								</li>
								<li>
									<strong>
										Without <code>width: 100%</code>
									</strong>{ ' ' }
									(defaults to <code>auto</code>) set on the
									TabList (tabs take up space proportional to
									their content).
								</li>
							</ul>
						</li>
					</ul>
				</div>
				<button
					style={ { marginBottom: '1rem' } }
					onClick={ () => setFullWidth( ! fullWidth ) }
				>
					{ fullWidth
						? 'Remove width: 100% from TabList'
						: 'Set width: 100% in TabList' }
				</button>
				<Tabs.Root
					{ ...props }
					style={ {
						...props.style,
						width: '20rem',
						border: '2px dotted red',
						padding: '1rem',
						resize: 'horizontal',
						overflow: 'auto',
					} }
				>
					<Tabs.List
						style={ {
							maxWidth: '100%',
							width: fullWidth ? '100%' : undefined,
						} }
					>
						<Tabs.Tab value="tab1">
							Label with multiple words
						</Tabs.Tab>
						<Tabs.Tab value="tab2">Short</Tabs.Tab>
						<Tabs.Tab value="tab3">
							Hippopotomonstrosesquippedaliophobia
						</Tabs.Tab>
						<Tabs.Tab value="tab4">Tab 4</Tabs.Tab>
						<Tabs.Tab value="tab5">Tab 5</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="tab1">
						<ThemedParagraph>Selected tab: Tab 1</ThemedParagraph>
						<ThemedParagraph>
							(Label with multiple words)
						</ThemedParagraph>
					</Tabs.Panel>
					<Tabs.Panel value="tab2">
						<ThemedParagraph>Selected tab: Tab 2</ThemedParagraph>
						<ThemedParagraph>(Short)</ThemedParagraph>
					</Tabs.Panel>
					<Tabs.Panel value="tab3">
						<ThemedParagraph>Selected tab: Tab 3</ThemedParagraph>
						<ThemedParagraph>
							(Hippopotomonstrosesquippedaliophobia)
						</ThemedParagraph>
					</Tabs.Panel>
					<Tabs.Panel value="tab4">
						<ThemedParagraph>Selected tab: Tab 4</ThemedParagraph>
					</Tabs.Panel>
					<Tabs.Panel value="tab5">
						<ThemedParagraph>Selected tab: Tab 5</ThemedParagraph>
					</Tabs.Panel>
				</Tabs.Root>
			</div>
		);
	},
	args: {
		...Default.args,
		defaultValue: 'tab4',
	},
};

export const Vertical: StoryObj< typeof Tabs.Root > = {
	args: {
		...Default.args,
		orientation: 'vertical',
		style: {
			minWidth: '320px',
			display: 'grid',
			gridTemplateColumns: '120px 1fr',
			gap: '24px',
		},
	},
};

export const WithDisabledTab: StoryObj< typeof Tabs.Root > = {
	args: {
		...Default.args,
		defaultValue: 'tab3',
		children: (
			<>
				<Tabs.List>
					<Tabs.Tab value="tab1" disabled>
						Tab 1
					</Tabs.Tab>
					<Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
					<Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
				</Tabs.List>
				<Tabs.Panel value="tab1">
					<ThemedParagraph>Selected tab: Tab 1</ThemedParagraph>
				</Tabs.Panel>
				<Tabs.Panel value="tab2">
					<ThemedParagraph>Selected tab: Tab 2</ThemedParagraph>
				</Tabs.Panel>
				<Tabs.Panel value="tab3">
					<ThemedParagraph>Selected tab: Tab 3</ThemedParagraph>
				</Tabs.Panel>
			</>
		),
	},
};

const LinkIcon = ( props: React.SVGProps< SVGSVGElement > ) => {
	return cloneElement( link, props );
};

const MoreIcon = ( props: React.SVGProps< SVGSVGElement > ) => {
	return cloneElement( more, props );
};

const WordpressIcon = ( props: React.SVGProps< SVGSVGElement > ) => {
	return cloneElement( wordpress, props );
};

const tabWithIconsData = [
	{
		value: 'tab1',
		label: 'Tab one',
		icon: WordpressIcon,
	},
	{
		value: 'tab2',
		label: 'Tab two',
		icon: LinkIcon,
	},
	{
		value: 'tab3',
		label: 'Tab three',
		icon: MoreIcon,
	},
];

export const WithTabIconsAndTooltips: StoryObj< typeof Tabs.Root > = {
	args: {
		...Default.args,
		children: (
			<>
				<Tabs.List>
					{ tabWithIconsData.map(
						( { value, label, icon: Icon } ) => (
							<Tooltip.Root key={ value }>
								<Tooltip.Trigger
									aria-label={ label }
									render={ <Tabs.Tab value={ value } /> }
								>
									{ /* TODO: potentially refactor with new Icon component */ }
									<Icon
										style={ {
											width: '20px',
											height: '20px',
										} }
									/>
								</Tooltip.Trigger>
								<Tooltip.Popup align="center" side="top">
									{ label }
								</Tooltip.Popup>
							</Tooltip.Root>
						)
					) }
				</Tabs.List>
				{ tabWithIconsData.map( ( { value, label } ) => (
					<Tabs.Panel value={ value } key={ value }>
						<ThemedParagraph>
							Selected tab: { label }
						</ThemedParagraph>
					</Tabs.Panel>
				) ) }
			</>
		),
	},
};

export const WithPanelsAlwaysMounted: StoryObj< typeof Tabs.Root > = {
	args: {
		...Default.args,
		children: (
			<>
				<Tabs.List>
					<Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
					<Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
					<Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
				</Tabs.List>
				<Tabs.Panel value="tab1" keepMounted>
					<ThemedParagraph>Selected tab: Tab 1</ThemedParagraph>
				</Tabs.Panel>
				<Tabs.Panel value="tab2" keepMounted>
					<ThemedParagraph>Selected tab: Tab 2</ThemedParagraph>
				</Tabs.Panel>
				<Tabs.Panel value="tab3" keepMounted>
					<ThemedParagraph>Selected tab: Tab 3</ThemedParagraph>
				</Tabs.Panel>
			</>
		),
	},
};

export const WithNonFocusablePanels: StoryObj< typeof Tabs.Root > = {
	args: {
		...Default.args,
		children: (
			<>
				<Tabs.List>
					<Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
					<Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
					<Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
				</Tabs.List>
				<Tabs.Panel value="tab1" tabIndex={ -1 }>
					<ThemedParagraph>Selected tab: Tab 1</ThemedParagraph>
					<ThemedParagraph>
						This tabpanel is not focusable, therefore tabbing into
						it will focus its first tabbable child.
					</ThemedParagraph>
					<button>Focus me</button>
				</Tabs.Panel>
				<Tabs.Panel value="tab2" tabIndex={ -1 }>
					<ThemedParagraph>Selected tab: Tab 2</ThemedParagraph>
					<ThemedParagraph>
						This tabpanel is not focusable, therefore tabbing into
						it will focus its first tabbable child.
					</ThemedParagraph>
					<button>Focus me</button>
				</Tabs.Panel>
				<Tabs.Panel value="tab3" tabIndex={ -1 }>
					<ThemedParagraph>Selected tab: Tab 3</ThemedParagraph>
					<ThemedParagraph>
						This tabpanel is not focusable, therefore tabbing into
						it will focus its first tabbable child.
					</ThemedParagraph>
					<button>Focus me</button>
				</Tabs.Panel>
			</>
		),
	},
};
