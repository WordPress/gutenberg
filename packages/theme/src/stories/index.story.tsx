/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import {
	useEffect,
	useState,
	useRef,
	useId,
	createPortal,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
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
import { ThemeProvider } from '../theme-provider';

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
	tags: [ 'status-experimental' ],
};
export default meta;

function getCSSCustomPropsFromStylesheets() {
	const semanticProps: Record< string, string > = {};
	const legacyProps: Record< string, string > = {};

	for ( const sheet of document.styleSheets ) {
		try {
			for ( const rule of sheet.cssRules || [] ) {
				const ruleStyle = ( rule as CSSStyleRule ).style;
				if ( ruleStyle ) {
					for ( const name of ruleStyle ) {
						if (
							name.startsWith( '--wp-admin-theme' ) ||
							name.startsWith( '--wp-components-color' )
						) {
							legacyProps[ name ] = ruleStyle
								.getPropertyValue( name )
								.trim();
						}
						if ( name.startsWith( '--wpds-color' ) ) {
							semanticProps[ name ] = ruleStyle
								.getPropertyValue( name )
								.trim();
						}
					}
				}
			}
		} catch ( e ) {
			// Avoid security errors from cross-origin stylesheets
			// eslint-disable-next-line no-console
			console.error( e );
			continue;
		}
	}

	return { semanticProps, legacyProps };
}

const ColorTokenTable = ( {
	tokens,
}: {
	tokens: Record< string, string >;
} ) => {
	return (
		<ul
			style={ {
				listStyle: 'none',
				display: 'flex',
				flexDirection: 'column',
				gap: '0.5rem',
			} }
		>
			{ Object.entries( tokens ).map( ( [ name ] ) => (
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
	const [ props, setProps ] = useState< {
		semanticProps: Record< string, string >;
		legacyProps: Record< string, string >;
	} >( {
		semanticProps: {},
		legacyProps: {},
	} );

	useEffect( () => {
		setProps( getCSSCustomPropsFromStylesheets() );
	}, [] );

	return (
		<div style={ { color: 'var( --wpds-color-fg-content-neutral )' } }>
			<h1>Design System Color tokens</h1>
			<h2>Semantic tokens (can be consumed directly)</h2>
			<ColorTokenTable tokens={ props.semanticProps } />
			<h2>Legacy tokens (should not be consumed directly)</h2>
			<details>
				<summary>Click to expand</summary>
				<ColorTokenTable tokens={ props.legacyProps } />
			</details>
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
								'var(--wpds-color-bg-surface-neutral)',
							color: 'var( --wpds-color-fg-content-neutral )',
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

const NestingDebug = ( { bg = '', primary = '', density = '' } ) => (
	<div
		style={ {
			padding: 'var(--wpds-dimension-padding-lg)',
			color: 'var(--wpds-color-fg-content-neutral)',
			backgroundColor: 'var(--wpds-color-bg-surface-neutral)',
			display: 'flex',
			alignItems: 'center',
			flexWrap: 'wrap',
			gap: '1rem',
		} }
	>
		<pre style={ { margin: 0 } }>
			bg: { bg } | primary: { primary } | density: { density }
		</pre>
		<span
			style={ {
				display: 'inline-block',
				padding: 'var(--wpds-dimension-padding-sm)',
				borderRadius: '0.25rem',
				backgroundColor:
					'var(--wpds-color-bg-interactive-brand-strong)',
				color: 'var(--wpds-color-fg-interactive-brand-strong)',
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
					'var(--wpds-color-bg-interactive-neutral-weak-disabled)',
				color: 'var(--wpds-color-fg-content-neutral)',
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
					bg="inherit (root)"
					primary="inherit (root)"
					density="inherit (root)"
				/>
				<div style={ { paddingInlineStart: '1rem' } }>
					<ThemeProvider
						color={ {
							bg: '#1e1e1e',
						} }
						density="compact"
					>
						<NestingDebug
							bg="#1e1e1e"
							primary="inherit (root)"
							density="compact"
						/>
						<div style={ { paddingInlineStart: '1rem' } }>
							<ThemeProvider>
								<NestingDebug
									bg="inherit (#1e1e1e)"
									primary="inherit (root)"
									density="inherit (compact)"
								/>
								<div style={ { paddingInlineStart: '1rem' } }>
									<ThemeProvider
										color={ { primary: 'hotpink' } }
										density="default"
									>
										<NestingDebug
											bg="inherit (#1e1e1e)"
											primary="hotpink"
											density="default"
										/>
										<div
											style={ {
												paddingInlineStart: '1rem',
											} }
										>
											<ThemeProvider
												color={ { bg: '#f8f8f8' } }
											>
												<NestingDebug
													bg="#f8f8f8"
													primary="inherit (hotpink)"
													density="inherit (default)"
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

function IframeWithClonedTokenStyles( {
	children,
}: {
	children: React.ReactNode;
} ) {
	const iframeRef = useRef< HTMLIFrameElement >( null );
	const [ iframeLoaded, setIframeLoaded ] = useState( false );

	// Copy the stylesheet where the DS tokens are defined to the iframe.
	// While this technique is a bit hacky, it works well enough for the purpose
	// of this demo.
	// Consumers of the DS could instead reference the stylesheet directly.
	useEffect( () => {
		const iframe = iframeRef.current;
		if ( ! iframe || ! iframe.contentDocument ) {
			return;
		}

		const head = iframe.contentDocument.head;

		// Filter styles associated with a theme provider
		const allStyles = Array.from(
			document.head.querySelectorAll( 'style, link[rel="stylesheet"]' )
		);

		allStyles.forEach( ( node ) => {
			if ( node.tagName === 'STYLE' ) {
				const text = node.textContent || '';
				if ( text.includes( 'data-wpds-theme-provider-id' ) ) {
					head.appendChild( node.cloneNode( true ) );
				}
			} else if ( node.tagName === 'LINK' ) {
				// Fetch and inspect the stylesheet content
				const href = ( node as HTMLLinkElement ).href;
				fetch( href )
					.then( ( res ) => res.text() )
					.then( ( css ) => {
						if ( css.includes( 'data-wpds-theme-provider-id' ) ) {
							const linkClone = node.cloneNode( true );
							head.appendChild( linkClone );
						}
					} )
					.catch( ( err ) => {
						// eslint-disable-next-line no-console
						console.warn( 'Failed to load stylesheet:', href, err );
					} );
			}
		} );

		setIframeLoaded( true );
	}, [] );

	return (
		<iframe
			ref={ iframeRef }
			style={ {
				width: '100%',
				height: '400px',
				border: '1px solid #ccc',
			} }
			title="demo"
		>
			{ iframeLoaded &&
				iframeRef.current?.contentDocument?.body &&
				createPortal(
					children,
					iframeRef.current.contentDocument.body
				) }
		</iframe>
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

export const ExampleApplication: StoryObj< typeof ThemeProvider > = {
	render: ( { primary, bg, density }: any ) => {
		return (
			<ThemeProvider color={ { primary, bg } } density={ density } isRoot>
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
								marginBlockEnd: 'var(--wpds-dimension-gap-xl)',
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
										<Text variant="body-md">{ item }</Text>
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
								borderRadius: 'var(--wpds-border-radius-lg)',
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
									padding: 'var(--wpds-dimension-padding-xl)',
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
									<Badge intent="informational">Beta</Badge>
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
									padding: 'var(--wpds-dimension-padding-xl)',
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
													Configure the basic settings
													for your site. You can
													update your{ ' ' }
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
													For more advanced options,
													visit the{ ' ' }
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
													<Text
														style={ {
															paddingBlockStart:
																'var(--wpds-dimension-padding-lg)',
														} }
													>
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
														pages. Options include
														full-width, boxed, and{ ' ' }
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
														Review your site&apos;s{ ' ' }
														<Link href="#">
															accessibility
															settings
														</Link>{ ' ' }
														to ensure it meets WCAG
														guidelines.
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
		);
	},
	argTypes: {
		children: { table: { disable: true } },
		isRoot: { table: { disable: true } },
		color: { table: { disable: true } },
		primary: {
			control: { type: 'color' },
			description: 'Primary seed color for the theme.',
		},
		bg: {
			control: { type: 'color' },
			description: 'Background seed color for the theme.',
		},
		density: {
			control: { type: 'select' },
			options: [ undefined, 'default', 'compact', 'comfortable' ],
		},
	} as any,
	args: {
		primary: undefined,
		bg: undefined,
		density: undefined,
	} as any,
	parameters: {
		docs: { canvas: { sourceState: 'hidden' } },
	},
};

export const AcrossIframes: StoryObj< typeof ThemeProvider > = {
	render: ( args ) => {
		return (
			<ThemeProvider { ...args }>
				{ args.children }

				<IframeWithClonedTokenStyles>
					<div
						style={ {
							color: 'var(--wpds-color-fg-content-neutral)',
						} }
					>
						In the iframe, but outside of `ThemeProvider`
					</div>
					<ThemeProvider
						{ ...args }
						// Note: the isRoot prop is necessary to apply the DS tokens to any
						// UI rendered outside of the ThemeProvider (including overlays, etc)
						isRoot
					>
						{ args.children }
					</ThemeProvider>
				</IframeWithClonedTokenStyles>
			</ThemeProvider>
		);
	},
	args: {
		children: (
			<div style={ { color: 'var(--wpds-color-fg-content-neutral)' } }>
				Code is poetry.{ ' ' }
				<span
					style={ {
						display: 'inline-block',
						padding: 'var(--wpds-dimension-padding-sm)',
						borderRadius: '0.25rem',
						backgroundColor:
							'var(--wpds-color-bg-interactive-brand-strong)',
						color: 'var(--wpds-color-fg-interactive-brand-strong)',
					} }
				>
					primary
				</span>
			</div>
		),
	},
};
