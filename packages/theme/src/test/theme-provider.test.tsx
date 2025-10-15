/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import * as React from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ThemeProvider } from '../theme-provider';

const NestingDebug = ( { bg = '', primary = '' } ) => (
	<div
		style={ {
			padding: '0.25rem',
			color: 'var(--wpds-color-fg-content-neutral)',
			backgroundColor: 'var(--wpds-color-bg-surface-neutral)',
			display: 'flex',
			alignItems: 'center',
			flexWrap: 'wrap',
			gap: '1rem',
		} }
	>
		<pre>
			bg: { bg } | primary: { primary }
		</pre>
		<span
			style={ {
				display: 'inline-block',
				padding: '0.25rem',
				borderRadius: '0.25rem',
				backgroundColor:
					'var(--wpds-color-bg-interactive-brand-strong)',
				color: 'var(--wpds-color-fg-interactive-brand-strong)',
			} }
		>
			Brand
		</span>
		<span
			style={ {
				display: 'inline-block',
				marginInlineStart: '0.25rem',
				padding: '0.25rem',
				borderRadius: '0.25rem',
				backgroundColor:
					'var(--wpds-color-bg-interactive-brand-weak-disabled)',
				color: 'var(--wpds-color-fg-content-neutral)',
			} }
		>
			Neutral
		</span>
	</div>
);

describe( 'ThemeProvider', () => {
	beforeAll( () => {
		Object.defineProperty( window, 'matchMedia', {
			writable: true,
			value: jest.fn(),
		} );
	} );

	test( 'nesting and applying styles', () => {
		const { container } = render(
			<ThemeProvider
				color={ {
					primary: '#38d5ef',
					bg: '#f8f8f8',
				} }
			>
				<ThemeProvider
					color={ {
						primary: 'pink',
					} }
				>
					<NestingDebug bg="inherit (root)" primary="pink" />
					<div style={ { paddingInlineStart: '1rem' } }>
						<ThemeProvider
							color={ {
								bg: '#1e1e1e',
							} }
						>
							<NestingDebug
								bg="#1e1e1e"
								primary="inherit (ping)"
							/>
							<div style={ { paddingInlineStart: '1rem' } }>
								<ThemeProvider>
									<NestingDebug
										bg="inherit (#1e1e1e)"
										primary="inherit (pink)"
									/>
									<div
										style={ { paddingInlineStart: '1rem' } }
									>
										<ThemeProvider
											color={ {
												primary: 'tomato',
											} }
										>
											<NestingDebug
												bg="inherit (#1e1e1e)"
												primary="tomato"
											/>
										</ThemeProvider>
									</div>
								</ThemeProvider>
							</div>
						</ThemeProvider>
					</div>
				</ThemeProvider>
			</ThemeProvider>
		);

		expect( container ).toMatchSnapshot();
	} );
} );
