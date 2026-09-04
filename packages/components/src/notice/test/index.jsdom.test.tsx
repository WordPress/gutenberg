import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import { createContext, useContext, useState } from '@wordpress/element';
import Notice from '../index';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );
const mockedSpeak = jest.mocked( speak );

const TestContext = createContext( 'context-value' );

// A child using hooks, like any `contextConnect`-ed or Emotion-styled
// component. Regression case for
// https://github.com/WordPress/gutenberg/issues/61199.
function ChildWithHooks() {
	const value = useContext( TestContext );
	const [ text ] = useState( 'stateful' );
	return <span>{ value + ':' + text }</span>;
}

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

	it( 'should not render a dismiss control when isDismissible prop is false', () => {
		render(
			<Notice isDismissible={ false }>I cannot be dismissed!</Notice>
		);

		expect(
			screen.queryByRole( 'button', { name: 'Close' } )
		).not.toBeInTheDocument();
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

		it( 'should speak a spokenMessage element that is distinct from children', () => {
			render(
				<Notice spokenMessage={ <em>Custom message</em> }>
					Visible content
				</Notice>
			);

			expect( speak ).toHaveBeenCalledWith(
				'<em>Custom message</em>',
				'polite'
			);
		} );

		it( 'should not speak when spokenMessage is null', () => {
			render( <Notice spokenMessage={ null }>FYI</Notice> );

			expect( speak ).not.toHaveBeenCalled();
		} );

		it( 'should speak the same message again after an empty message', () => {
			const { rerender } = render(
				<Notice spokenMessage="Saved">Content</Notice>
			);
			rerender( <Notice spokenMessage="">Content</Notice> );
			rerender( <Notice spokenMessage="Saved">Content</Notice> );

			expect( speak ).toHaveBeenCalledTimes( 2 );
			expect( speak ).toHaveBeenNthCalledWith( 1, 'Saved', 'polite' );
			expect( speak ).toHaveBeenNthCalledWith( 2, 'Saved', 'polite' );
		} );

		it( 'should speak a message containing components that use hooks', () => {
			render(
				<Notice>
					Saving
					<ChildWithHooks />
				</Notice>
			);

			expect( speak ).toHaveBeenCalledWith(
				'Saving<span>context-value:stateful</span>',
				'polite'
			);
		} );

		// Regression test for https://github.com/WordPress/gutenberg/issues/61199.
		it( 'should not crash when a child using hooks is conditionally rendered', () => {
			const { rerender } = render(
				<Notice>
					Saving
					<ChildWithHooks />
				</Notice>
			);

			expect( () => rerender( <Notice>Saved</Notice> ) ).not.toThrow();
			expect( speak ).toHaveBeenLastCalledWith( 'Saved', 'polite' );
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
