import { render } from '@testing-library/react';
import { speak } from '@wordpress/a11y';
import * as Notice from '../index';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );
const mockedSpeak = jest.mocked( speak );

describe( 'Notice spoken messages', () => {
	beforeEach( () => {
		mockedSpeak.mockReset();
	} );

	it( 'should not speak when spokenMessage is null', () => {
		render(
			<Notice.Root spokenMessage={ null }>
				<Notice.Description>Visible content</Notice.Description>
			</Notice.Root>
		);

		expect( speak ).not.toHaveBeenCalled();
	} );
} );
