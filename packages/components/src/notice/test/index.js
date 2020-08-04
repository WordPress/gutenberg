/**
 * External dependencies
 */
import ShallowRenderer from 'react-test-renderer/shallow';
import { create } from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import TokenList from '@wordpress/token-list';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import Notice from '../index';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

describe( 'Notice', () => {
	beforeEach( () => {
		speak.mockReset();
	} );

	it( 'should match snapshot', () => {
		const renderer = new ShallowRenderer();

		renderer.render(
			<Notice
				status="success"
				actions={ [
					{ label: 'More information', url: 'https://example.com' },
					{ label: 'Cancel', onClick() {} },
					{ label: 'Submit', onClick() {}, isPrimary: true },
				] }
			>
				Example
			</Notice>
		);

		expect( renderer.getRenderOutput() ).toMatchSnapshot();
	} );

	it( 'should not have is-dismissible class when isDismissible prop is false', () => {
		const renderer = new ShallowRenderer();

		renderer.render( <Notice isDismissible={ false } /> );

		const classes = new TokenList(
			renderer.getRenderOutput().props.className
		);
		expect( classes.contains( 'components-notice' ) ).toBe( true );
		expect( classes.contains( 'is-dismissible' ) ).toBe( false );
	} );

	it( 'should default to info status', () => {
		const renderer = new ShallowRenderer();

		renderer.render( <Notice /> );

		const classes = new TokenList(
			renderer.getRenderOutput().props.className
		);
		expect( classes.contains( 'is-info' ) ).toBe( true );
	} );

	describe( 'useSpokenMessage', () => {
		it( 'should speak the given message', () => {
			const tree = create( <Notice>FYI</Notice> );
			tree.update();

			expect( speak ).toHaveBeenCalledWith( 'FYI', 'polite' );
		} );

		it( 'should speak the given message by explicit politeness', () => {
			const tree = create(
				<Notice politeness="assertive">Uh oh!</Notice>
			);
			tree.update();

			expect( speak ).toHaveBeenCalledWith( 'Uh oh!', 'assertive' );
		} );

		it( 'should speak the given message by implicit politeness by status', () => {
			const tree = create( <Notice status="error">Uh oh!</Notice> );
			tree.update();

			expect( speak ).toHaveBeenCalledWith( 'Uh oh!', 'assertive' );
		} );

		it( 'should speak the given message, preferring explicit to implicit politeness', () => {
			const tree = create(
				<Notice politeness="polite" status="error">
					No need to panic
				</Notice>
			);
			tree.update();

			expect( speak ).toHaveBeenCalledWith(
				'No need to panic',
				'polite'
			);
		} );

		it( 'should coerce a message to a string', () => {
			// This test assumes that `@wordpress/a11y` is capable of handling
			// markup strings appropriately.
			const tree = create(
				<Notice>
					With <em>emphasis</em> this time.
				</Notice>
			);
			tree.update();

			expect( speak ).toHaveBeenCalledWith(
				'With <em>emphasis</em> this time.',
				'polite'
			);
		} );

		it( 'should not re-speak an effectively equivalent element message', () => {
			const tree = create(
				<Notice>
					With <em>emphasis</em> this time.
				</Notice>
			);
			tree.update(
				<Notice>
					With <em>emphasis</em> this time.
				</Notice>
			);

			expect( speak ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
