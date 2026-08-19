import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from '@wordpress/element';
import { ThemeProvider } from '../theme-provider';
import type { ThemeProviderColorWarning } from '../theme-provider-color-warnings';
import { ColorWarningDetails } from './color-warning-details';

type SeedCombination = {
	label: string;
	source: string;
	primary: string;
	background: string;
};

type WorkbenchProps = Pick< SeedCombination, 'primary' | 'background' >;

const REQUIRED_COMBINATIONS = [
	{
		label: 'Default light',
		source: 'ThemeProvider defaults',
		primary: '#3858e9',
		background: '#fcfcfc',
	},
	{
		label: 'Tooltip dark',
		source: 'Tooltip',
		primary: '#3858e9',
		background: '#1e1e1e',
	},
	{
		label: 'Modern admin dark',
		source: 'WordPress admin',
		primary: '#3858e9',
		background: '#222524',
	},
	{
		label: '#81162 reproduction',
		source: 'GitHub issue #81162',
		primary: '#608010',
		background: '#4f386e',
	},
] as const satisfies readonly SeedCombination[];

function CombinationDiagnostics( {
	label,
	source,
	primary,
	background,
}: SeedCombination ) {
	const headingId = useId();
	const [ warnings, setWarnings ] = useState<
		readonly ThemeProviderColorWarning[] | undefined
	>();

	return (
		<>
			<ThemeProvider
				color={ { primary, background } }
				onColorWarnings={ setWarnings }
			/>
			<article
				aria-labelledby={ headingId }
				style={ {
					border: '1px solid #dcdcde',
					padding: '1rem',
				} }
			>
				<h2 id={ headingId }>{ label }</h2>
				<dl>
					<dt>Source</dt>
					<dd>{ source }</dd>
					<dt>Primary seed</dt>
					<dd>
						<code>{ primary }</code>
					</dd>
					<dt>Background seed</dt>
					<dd>
						<code>{ background }</code>
					</dd>
				</dl>
				<ColorWarningDetails warnings={ warnings } />
			</article>
		</>
	);
}

function ColorWarningsWorkbench( { primary, background }: WorkbenchProps ) {
	return (
		<main
			style={ {
				display: 'grid',
				gap: '1rem',
			} }
		>
			<CombinationDiagnostics
				key={ `${ primary }-${ background }` }
				label="Custom seeds"
				source="Storybook controls"
				primary={ primary }
				background={ background }
			/>
			{ REQUIRED_COMBINATIONS.map( ( combination ) => (
				<CombinationDiagnostics
					key={ combination.label }
					{ ...combination }
				/>
			) ) }
		</main>
	);
}

const meta: Meta< typeof ColorWarningsWorkbench > = {
	title: 'Design System/Theme/Theme Provider/Color Warnings',
	component: ColorWarningsWorkbench,
	args: {
		primary: '#608010',
		background: '#4f386e',
	},
	argTypes: {
		primary: {
			control: { type: 'color' },
		},
		background: {
			control: { type: 'color' },
		},
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
	tags: [ 'status-private' ],
};

export default meta;

export const Workbench: StoryObj< typeof ColorWarningsWorkbench > = {};
