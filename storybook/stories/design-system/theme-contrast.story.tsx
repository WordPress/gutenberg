import type { Meta, StoryObj } from '@storybook/react-vite';
import { contrastLevels, ThemeProvider } from '@wordpress/theme';
import {
	Badge,
	Button,
	InputControl,
	Notice,
	SelectControl,
	Stack,
	Text,
} from '@wordpress/ui';

type ThemeProviderColor = React.ComponentProps<
	typeof ThemeProvider
>[ 'color' ];

const LEVELS = [
	{ title: 'Minimum', value: contrastLevels.minimum },
	{ title: 'Standard', value: contrastLevels.standard },
	{ title: 'Enhanced', value: contrastLevels.enhanced },
] as const;

const THEMES: Array< {
	title: string;
	description: string;
	color: ThemeProviderColor;
} > = [
	{
		title: 'Default',
		description: 'The default seeds.',
		color: { primary: '#3858e9', background: '#fcfcfc' },
	},
	{
		title: 'Dark',
		description:
			'The Fresh admin scheme. Above 0 the background gets darker to make room for stronger text.',
		color: { primary: '#3858e9', background: '#25292b' },
	},
	{
		title: 'Mid-tone brand',
		description:
			'A mid-tone primary seed. Above 0 the brand color is darkened or lightened so its button label can reach the higher target.',
		color: { primary: '#2f8f83', background: '#fcfcfc' },
	},
];

const languageOptions = [
	{ value: 'en_US', label: 'English (United States)' },
	{ value: 'fr_FR', label: 'Français' },
];

function Sample( { level }: { level: ( typeof LEVELS )[ number ] } ) {
	return (
		<Stack
			direction="column"
			gap="md"
			style={ {
				padding: 'var(--wpds-dimension-padding-lg)',
				backgroundColor: 'var(--wpds-color-background-surface-neutral)',
				color: 'var(--wpds-color-foreground-content-neutral)',
				borderRadius: 'var(--wpds-border-radius-lg)',
				border: 'var(--wpds-border-width-xs) solid var(--wpds-color-stroke-surface-neutral-weak)',
			} }
		>
			<Stack direction="row" gap="sm" style={ { alignItems: 'center' } }>
				<Text variant="heading-sm" render={ <h3 /> }>
					{ level.title }
				</Text>
				<Badge intent="informational">{ String( level.value ) }</Badge>
			</Stack>
			<Text>Body text on the base surface.</Text>
			<Text
				style={ {
					color: 'var(--wpds-color-foreground-content-neutral-weak)',
				} }
			>
				Weak text for help and secondary details.
			</Text>
			<InputControl label="Site title" defaultValue="My WordPress site" />
			<SelectControl
				label="Site language"
				items={ languageOptions }
				defaultValue={ languageOptions[ 0 ] }
			/>
			<Notice.Root intent="info">
				<Notice.Title>Welcome to your new site</Notice.Title>
				<Notice.Description>
					Complete the steps below to finish setting up.
				</Notice.Description>
			</Notice.Root>
			<Stack direction="row" gap="sm" style={ { flexWrap: 'wrap' } }>
				<Button>Save</Button>
				<Button tone="neutral">Publish</Button>
				<Button variant="outline">Cancel</Button>
			</Stack>
			<div
				style={ {
					padding: 'var(--wpds-dimension-padding-sm)',
					borderRadius: 'var(--wpds-border-radius-sm)',
					outline:
						'var(--wpds-border-width-focus) solid var(--wpds-color-stroke-focus)',
					outlineOffset: '2px',
				} }
			>
				<Text variant="body-sm">Focus ring</Text>
			</div>
		</Stack>
	);
}

const meta: Meta< typeof ThemeProvider > = {
	title: 'Design System/Theme/Theme Provider/Contrast',
	component: ThemeProvider,
	parameters: {
		controls: { disable: true },
		docs: { canvas: { sourceState: 'hidden' } },
		a11y: {
			config: {
				rules: [
					{
						id: 'color-contrast',
						// The Minimum column deliberately falls below WCAG AA
						// for weak text and strokes.
						enabled: false,
					},
				],
			},
		},
	},
};
export default meta;

/**
 * The same interface at the `minimum`, `standard` and `enhanced` values of
 * `contrastLevels`, for three themes. Each column is a nested `ThemeProvider`
 * that only sets `contrast`, inheriting its colors from the row.
 */
export const Comparison: StoryObj< typeof meta > = {
	render: () => (
		<Stack direction="column" gap="xl">
			{ THEMES.map( ( theme ) => (
				<Stack key={ theme.title } direction="column" gap="sm">
					<Text variant="heading-md" render={ <h2 /> }>
						{ theme.title }
					</Text>
					<Text>{ theme.description }</Text>
					<ThemeProvider color={ theme.color }>
						<div
							style={ {
								display: 'grid',
								gap: 'var(--wpds-dimension-gap-lg)',
								gridTemplateColumns:
									'repeat(auto-fit, minmax(260px, 1fr))',
							} }
						>
							{ LEVELS.map( ( level ) => (
								<ThemeProvider
									key={ level.title }
									contrast={ level.value }
								>
									<Sample level={ level } />
								</ThemeProvider>
							) ) }
						</div>
					</ThemeProvider>
				</Stack>
			) ) }
		</Stack>
	),
};
