import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useId } from '@wordpress/element';
import { ThemeProvider } from '../theme-provider';
import wpdsTokens from '../prebuilt/js/design-tokens.mjs';

const wpdsColorTokens = wpdsTokens.filter( ( name ) =>
	name.startsWith( '--wpds-color' )
);

const meta: Meta< typeof ThemeProvider > = {
	title: 'Design System/Theme/Theme Provider',
	component: ThemeProvider,
	args: {
		isRoot: true,
	},
	argTypes: {
		children: {
			control: false,
		},
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const ColorTokenTable = ( { tokens }: { tokens: string[] } ) => {
	return (
		<ul
			style={ {
				listStyle: 'none',
				display: 'flex',
				flexDirection: 'column',
				gap: '0.5rem',
			} }
		>
			{ tokens.map( ( name ) => (
				<li
					key={ name }
					style={ {
						display: 'grid',
						gridTemplateColumns: '80px	1fr',
						alignItems: 'center',
						gap: '0.5rem',
					} }
				>
					<span
						style={ {
							backgroundColor: `var(${ name })`,
							border: '1px solid var(--wpds-color-stroke-surface-neutral)',
							width: '100%',
							aspectRatio: '2/1',
							display: 'block',
						} }
						aria-label={ name }
					></span>
					<code>{ name }</code>
				</li>
			) ) }
		</ul>
	);
};

const DSTokensList = () => {
	return (
		<div
			style={ {
				color: 'var( --wpds-color-foreground-content-neutral )',
			} }
		>
			<h1>Design System Color tokens</h1>
			<ColorTokenTable tokens={ wpdsColorTokens } />
		</div>
	);
};

export const Default: StoryObj< typeof ThemeProvider > = {
	args: {
		children: <DSTokensList />,
	},
};

export const WithPicker: StoryObj< typeof ThemeProvider > = {
	render: ( args ) => {
		const id = useId();
		const [ primary, setPrimary ] = useState< undefined | string >();

		return (
			<ThemeProvider
				{ ...args }
				color={ {
					primary,
				} }
			>
				<div style={ { position: 'relative' } }>
					<div
						style={ {
							position: 'sticky',
							top: 0,
							right: 0,
							backgroundColor:
								'var(--wpds-color-background-surface-neutral)',
							color: 'var( --wpds-color-foreground-content-neutral )',
							padding: '0.5rem',
							borderRadius: '0.5rem',
							boxShadow: '0 0 0.5rem 0 rgba(0, 0, 0, 0.1)',
						} }
					>
						<div>
							<input
								type="color"
								id={ id }
								name="primary"
								value={ primary }
								onChange={ ( e ) =>
									setPrimary( e.target.value )
								}
							/>
							<label htmlFor={ id }>Pick the primary color</label>
						</div>
					</div>
					{ args.children }
				</div>
			</ThemeProvider>
		);
	},
	args: {
		children: <DSTokensList />,
	},
};

const NestingDebug = ( { background = '', primary = '' } ) => (
	<div
		style={ {
			padding: 'var(--wpds-dimension-padding-lg)',
			color: 'var(--wpds-color-foreground-content-neutral)',
			backgroundColor: 'var(--wpds-color-background-surface-neutral)',
			display: 'flex',
			alignItems: 'center',
			flexWrap: 'wrap',
			gap: '1rem',
		} }
	>
		<pre style={ { margin: 0 } }>
			background: { background } | primary: { primary }
		</pre>
		<span
			style={ {
				display: 'inline-block',
				padding: 'var(--wpds-dimension-padding-sm)',
				borderRadius: '0.25rem',
				backgroundColor:
					'var(--wpds-color-background-interactive-brand-strong)',
				color: 'var(--wpds-color-foreground-interactive-brand-strong)',
			} }
		>
			primary
		</span>
		<span
			style={ {
				display: 'inline-block',
				marginInlineStart: '0.25rem',
				padding: 'var(--wpds-dimension-padding-sm)',
				borderRadius: '0.25rem',
				backgroundColor:
					'var(--wpds-color-background-interactive-neutral-weak-disabled)',
				color: 'var(--wpds-color-foreground-content-neutral)',
			} }
		>
			Neutral
		</span>
	</div>
);

export const NestingAndInheriting: StoryObj< typeof ThemeProvider > = {
	render: () => {
		return (
			<ThemeProvider>
				<NestingDebug
					background="inherit (root)"
					primary="inherit (root)"
				/>
				<div style={ { paddingInlineStart: '1rem' } }>
					<ThemeProvider
						color={ {
							background: '#1e1e1e',
						} }
					>
						<NestingDebug
							background="#1e1e1e"
							primary="inherit (root)"
						/>
						<div style={ { paddingInlineStart: '1rem' } }>
							<ThemeProvider>
								<NestingDebug
									background="inherit (#1e1e1e)"
									primary="inherit (root)"
								/>
								<div style={ { paddingInlineStart: '1rem' } }>
									<ThemeProvider
										color={ { primary: 'hotpink' } }
									>
										<NestingDebug
											background="inherit (#1e1e1e)"
											primary="hotpink"
										/>
										<div
											style={ {
												paddingInlineStart: '1rem',
											} }
										>
											<ThemeProvider
												color={ {
													background: '#f8f8f8',
												} }
											>
												<NestingDebug
													background="#f8f8f8"
													primary="inherit (hotpink)"
												/>
											</ThemeProvider>
										</div>
									</ThemeProvider>
								</div>
							</ThemeProvider>
						</div>
					</ThemeProvider>
				</div>
			</ThemeProvider>
		);
	},
};
