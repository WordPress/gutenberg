import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
	createReduxStore,
	createRegistry,
	RegistryProvider,
} from '@wordpress/data';
import TemplateAuthorView from '../view';
import type { Template } from '../../../types';

vi.mock( import( '@wordpress/icons' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	commentAuthorAvatar: (
		<svg>
			<title>User fallback</title>
		</svg>
	),
	layout: (
		<svg>
			<title>Theme fallback</title>
		</svg>
	),
	plugins: (
		<svg>
			<title>Plugin fallback</title>
		</svg>
	),
	globe: (
		<svg>
			<title>Site fallback</title>
		</svg>
	),
} ) );

const sources = [
	[ 'theme', 'Theme fallback' ],
	[ 'plugin', 'Plugin fallback' ],
	[ 'site', 'Site fallback' ],
	[ 'user', 'User fallback' ],
] as const;

describe( 'TemplateAuthorView', () => {
	it.each( sources )(
		'keeps the %s source fallback when the image is missing or fails',
		( source, fallbackTitle ) => {
			const registry = createRegistry();
			registry.register(
				createReduxStore( 'core', {
					reducer: ( state = {} ) => state,
					selectors: {
						getEntityRecord: (
							_state: unknown,
							_kind: string,
							name: string
						) =>
							name === '__unstableBase'
								? { site_logo: 99 }
								: { source_url: '/missing.png' },
						getUser: () => ( {
							avatar_urls: { 48: '/missing.png' },
						} ),
					},
				} )
			);
			const item: Template = {
				id: 'theme//example',
				type: 'wp_template',
				title: 'Example',
				content: '',
				is_custom: true,
				source,
				origin: source,
				has_theme_file: false,
				original_source: source,
				author: 1,
				author_text: 'Template author',
			};
			render(
				<RegistryProvider value={ registry }>
					<TemplateAuthorView item={ item } />
				</RegistryProvider>
			);
			expect( screen.getByText( 'Template author' ) ).toBeVisible();
			expect(
				source === 'user'
					? screen.getByText( 'TA' )
					: screen.getByTitle( fallbackTitle )
			).toBeInTheDocument();
			expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
		}
	);
} );
