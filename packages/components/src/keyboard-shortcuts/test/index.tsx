/**
 * External dependencies
 */
import { createEvent, fireEvent, screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import KeyboardShortcuts from '..';

describe( 'KeyboardShortcuts', () => {
	function keyPress(
		which: KeyboardEvent[ 'which' ],
		target: Parameters< typeof fireEvent >[ 0 ]
	) {
		[ 'keydown', 'keypress', 'keyup' ].forEach( ( eventName ) => {
			const event = createEvent(
				eventName,
				target,
				{
					bubbles: true,
					keyCode: which,
					which,
				},
				{ EventType: 'KeyboardEvent' }
			);
			fireEvent( target, event );
		} );
	}

	it( 'should capture key events', async () => {
		const spy = jest.fn();

		await render(
			<KeyboardShortcuts
				shortcuts={ {
					d: spy,
				} }
			/>
		);

		keyPress( 68, document );

		expect( spy ).toHaveBeenCalled();
	} );

	it( 'should capture key events globally', async () => {
		const spy = jest.fn();

		await render(
			<div>
				<KeyboardShortcuts
					bindGlobal
					shortcuts={ {
						d: spy,
					} }
				/>
				<textarea></textarea>
			</div>
		);

		keyPress( 68, screen.getByRole( 'textbox' ) );

		expect( spy ).toHaveBeenCalled();
	} );

	it( 'should capture key events on specific event', async () => {
		const spy = jest.fn();

		await render(
			<div>
				<KeyboardShortcuts
					eventName="keyup"
					shortcuts={ {
						d: spy,
					} }
				/>
				<textarea></textarea>
			</div>
		);

		keyPress( 68, screen.getByRole( 'textbox' ) );

		expect( spy.mock.calls[ 0 ][ 0 ].type ).toBe( 'keyup' );
	} );

	it( 'should capture key events on children', async () => {
		const spy = jest.fn();

		await render(
			<div>
				<KeyboardShortcuts
					shortcuts={ {
						d: spy,
					} }
				>
					<textarea></textarea>
				</KeyboardShortcuts>
				<textarea></textarea>
			</div>
		);

		const textareas = screen.getAllByRole( 'textbox' );

		// Outside scope
		keyPress( 68, textareas[ 1 ] );
		expect( spy ).not.toHaveBeenCalled();

		// Inside scope
		keyPress( 68, textareas[ 0 ] );
		expect( spy ).toHaveBeenCalled();
	} );
} );
