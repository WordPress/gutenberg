/**
 * External dependencies
 */

import { render } from '@ariakit/test/react';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import Notice from '../index';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );
const mockedSpeak = jest.mocked( speak );

function getNoticeWrapper( container: HTMLElement ) {
	return container.firstChild;
}

describe( 'Notice', () => {
	beforeEach( () => {
		mockedSpeak.mockReset();
	} );

	it( 'should match snapshot', async () => {
		const { container } = await render(
			<Notice
				status="success"
				actions={ [
					{ label: 'More information', url: 'https://example.com' },
					{ label: 'Cancel', onClick() {} },
					{ label: 'Submit', onClick() {}, variant: 'primary' },
				] }
			>
				Example
			</Notice>
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should not have is-dismissible class when isDismissible prop is false', async () => {
		const { container } = await render(
			<Notice isDismissible={ false }>I cannot be dismissed!</Notice>
		);
		const wrapper = getNoticeWrapper( container );

		expect( wrapper ).toHaveClass( 'components-notice' );
		expect( wrapper ).not.toHaveClass( 'is-dismissible' );
	} );

	it( 'should default to info status', async () => {
		const { container } = await render( <Notice>FYI</Notice> );

		expect( getNoticeWrapper( container ) ).toHaveClass( 'is-info' );
	} );

	describe( 'useSpokenMessage', () => {
		it( 'should speak the given message', async () => {
			await render( <Notice>FYI</Notice> );

			expect( speak ).toHaveBeenCalledWith( 'FYI', 'polite' );
		} );

		it( 'should speak the given message by explicit politeness', async () => {
			await render( <Notice politeness="assertive">Uh oh!</Notice> );

			expect( speak ).toHaveBeenCalledWith( 'Uh oh!', 'assertive' );
		} );

		it( 'should speak the given message by implicit politeness by status', async () => {
			await render( <Notice status="error">Uh oh!</Notice> );

			expect( speak ).toHaveBeenCalledWith( 'Uh oh!', 'assertive' );
		} );

		it( 'should speak the given message, preferring explicit to implicit politeness', async () => {
			await render(
				<Notice politeness="polite" status="error">
					No need to panic
				</Notice>
			);

			expect( speak ).toHaveBeenCalledWith(
				'No need to panic',
				'polite'
			);
		} );

		it( 'should coerce a message to a string', async () => {
			// This test assumes that `@wordpress/a11y` is capable of handling
			// markup strings appropriately.
			await render(
				<Notice>
					With <em>emphasis</em> this time.
				</Notice>
			);

			expect( speak ).toHaveBeenCalledWith(
				'With <em>emphasis</em> this time.',
				'polite'
			);
		} );

		it( 'should not re-speak an effectively equivalent element message', async () => {
			const { rerender } = await render(
				<Notice>
					With <em>emphasis</em> this time.
				</Notice>
			);
			await rerender(
				<Notice>
					With <em>emphasis</em> this time.
				</Notice>
			);

			expect( speak ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
