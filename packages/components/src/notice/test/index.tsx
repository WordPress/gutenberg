/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

	it( 'should match snapshot', () => {
		const { container } = render(
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

	it( 'should not have is-dismissible class when isDismissible prop is false', () => {
		const { container } = render(
			<Notice isDismissible={ false }>I cannot be dismissed!</Notice>
		);
		const wrapper = getNoticeWrapper( container );

		expect( wrapper ).toHaveClass( 'components-notice' );
		expect( wrapper ).not.toHaveClass( 'is-dismissible' );
	} );

	it( 'should default to info status', () => {
		const { container } = render( <Notice>FYI</Notice> );

		expect( getNoticeWrapper( container ) ).toHaveClass( 'is-info' );
	} );

	describe( 'useSpokenMessage', () => {
		it( 'should speak the given message', () => {
			render( <Notice>FYI</Notice> );

			expect( speak ).toHaveBeenCalledWith( 'FYI', 'polite' );
		} );

		it( 'should speak the given message by explicit politeness', () => {
			render( <Notice politeness="assertive">Uh oh!</Notice> );

			expect( speak ).toHaveBeenCalledWith( 'Uh oh!', 'assertive' );
		} );

		it( 'should speak the given message by implicit politeness by status', () => {
			render( <Notice status="error">Uh oh!</Notice> );

			expect( speak ).toHaveBeenCalledWith( 'Uh oh!', 'assertive' );
		} );

		it( 'should speak the given message, preferring explicit to implicit politeness', () => {
			render(
				<Notice politeness="polite" status="error">
					No need to panic
				</Notice>
			);

			expect( speak ).toHaveBeenCalledWith(
				'No need to panic',
				'polite'
			);
		} );

		it( 'should coerce a message to a string', () => {
			// This test assumes that `@wordpress/a11y` is capable of handling
			// markup strings appropriately.
			render(
				<Notice>
					With <em>emphasis</em> this time.
				</Notice>
			);

			expect( speak ).toHaveBeenCalledWith(
				'With <em>emphasis</em> this time.',
				'polite'
			);
		} );

		it( 'should not re-speak an effectively equivalent element message', () => {
			const { rerender } = render(
				<Notice>
					With <em>emphasis</em> this time.
				</Notice>
			);
			rerender(
				<Notice>
					With <em>emphasis</em> this time.
				</Notice>
			);

			expect( speak ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'actions', () => {
		it( 'should render a disabled action button', () => {
			render(
				<Notice
					actions={ [
						{
							label: 'Disabled action',
							onClick: jest.fn(),
							disabled: true,
						},
					] }
				>
					Notice with action
				</Notice>
			);

			const button = screen.getByRole( 'button', {
				name: 'Disabled action',
			} );
			// Button uses accessibleWhenDisabled, so it uses aria-disabled
			expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
		} );

		it( 'should call onClick when action with url is clicked', async () => {
			const user = userEvent.setup();
			const onClick = jest.fn( ( e ) => e.preventDefault() );

			render(
				<Notice
					actions={ [
						{
							label: 'Link with onClick',
							url: 'https://example.com',
							onClick,
						},
					] }
				>
					Notice with link and onClick
				</Notice>
			);

			const link = screen.getByRole( 'link', {
				name: 'Link with onClick',
			} );
			await user.click( link );

			expect( onClick ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
