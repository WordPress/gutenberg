import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { SlotFillProvider } from '@wordpress/components';
import { createElement } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import LinkControl from '../';

vi.mock( import( '@wordpress/data' ), { spy: true } );

beforeEach( () => {
	vi.mocked( useDispatch ).mockReturnValue( {
		saveEntityRecords: vi.fn(),
	} );
	vi.mocked( useSelect ).mockReturnValue( {
		fetchSearchSuggestions: () => Promise.resolve( [] ),
	} );
} );

describe( 'LinkControl protocol validation', () => {
	describe.each( [ 'Apply', 'Enter' ] )( 'submission with %s', ( submit ) => {
		it.each( [ 'mailto:hello@wordpress.org', 'tel:123456789' ] )(
			'should submit %s without changing its protocol',
			async ( url ) => {
				const user = userEvent.setup();
				const onChange = vi.fn();
				await render(
					createElement(
						SlotFillProvider,
						null,
						createElement( LinkControl, {
							value: { url: 'https://wordpress.org' },
							forceIsEditingLink: true,
							onChange,
						} )
					)
				);

				const input = page.getByRole( 'combobox' );
				await user.clear( input );
				await user.type( input, url );
				await expect
					.element( page.getByRole( 'option' ) )
					.toBeVisible();

				if ( submit === 'Apply' ) {
					await user.click(
						page.getByRole( 'button', { name: 'Apply' } )
					);
				} else {
					await user.keyboard( '{Enter}' );
				}

				await expect
					.poll( () => onChange.mock.calls )
					.toEqual( [ [ expect.objectContaining( { url } ) ] ] );
			}
		);
	} );
} );
