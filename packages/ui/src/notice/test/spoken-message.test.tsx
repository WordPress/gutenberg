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

	it( 'should speak the same message again after an empty message', () => {
		const { rerender } = render(
			<Notice.Root spokenMessage="Saved">
				<Notice.Description>Content</Notice.Description>
			</Notice.Root>
		);
		rerender(
			<Notice.Root spokenMessage="">
				<Notice.Description>Content</Notice.Description>
			</Notice.Root>
		);
		rerender(
			<Notice.Root spokenMessage="Saved">
				<Notice.Description>Content</Notice.Description>
			</Notice.Root>
		);

		expect( speak ).toHaveBeenCalledTimes( 2 );
		expect( speak ).toHaveBeenNthCalledWith( 1, 'Saved', 'polite' );
		expect( speak ).toHaveBeenNthCalledWith( 2, 'Saved', 'polite' );
	} );

	it( 'should not announce again when only the intent icon changes', () => {
		const { rerender } = render(
			<Notice.Root intent="info">
				<Notice.Description>Saved</Notice.Description>
			</Notice.Root>
		);
		rerender(
			<Notice.Root intent="success">
				<Notice.Description>Saved</Notice.Description>
			</Notice.Root>
		);

		expect( speak ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not announce text from the icon', () => {
		render(
			<Notice.Root
				icon={
					<svg>
						<title>Icon title</title>
					</svg>
				}
			>
				<Notice.Description>Saved</Notice.Description>
			</Notice.Root>
		);

		expect( speak ).toHaveBeenCalledTimes( 1 );
		expect( mockedSpeak.mock.calls[ 0 ][ 0 ] ).not.toContain(
			'Icon title'
		);
	} );
} );
