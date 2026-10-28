import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import InlineNotices from '../index';
import { store as noticesStore } from '../../../store';

describe( 'InlineNotices server rendering', () => {
	it( 'renders HTML notices on the server without a DOM', () => {
		function renderNotice() {
			const registry = createRegistry();
			registry.register( noticesStore );
			registry
				.dispatch( noticesStore )
				.createNotice( 'error', '<strong>Updating failed.</strong>', {
					__unstableHTML: true,
				} );

			return renderToStaticMarkup(
				<RegistryProvider value={ registry }>
					<InlineNotices />
				</RegistryProvider>
			);
		}

		const markup = renderNotice();
		expect( markup ).toContain( '<strong>Updating failed.</strong>' );
		expect( renderNotice() ).toBe( markup );
		expect( console ).toHaveWarned();
	} );
} );
