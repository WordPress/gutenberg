/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import Slot from '../slot';
import Fill from '../fill';
import Provider from '../provider';

describe( 'Slot', () => {
	it( 'should render empty Fills', () => {
		const element = mount(
			<Provider>
				<Slot name="chicken" />
				<Fill name="chicken" />
			</Provider>
		);

		expect( element.find( 'Slot > div' ).html() ).toBe( '<div></div>' );
	} );

	it( 'should render a string Fill', () => {
		const element = mount(
			<Provider>
				<Slot name="chicken" />
				<Fill name="chicken">
					content
				</Fill>
			</Provider>
		);

		expect( element.find( 'Slot > div' ).html() ).toBe( '<div>content</div>' );
	} );

	it( 'should render a Fill containing an element', () => {
		const element = mount(
			<Provider>
				<Slot name="chicken" />
				<Fill name="chicken">
					<span />
				</Fill>
			</Provider>
		);

		expect( element.find( 'Slot > div' ).html() ).toBe( '<div><span></span></div>' );
	} );

	it( 'should render a Fill containing an array', () => {
		const element = mount(
			<Provider>
				<Slot name="chicken" />
				<Fill name="chicken">
					{ [ <span key="1" />, <div key="2" />, 'text' ] }
				</Fill>
			</Provider>
		);

		expect( element.find( 'Slot > div' ).html() ).toBe( '<div><span></span><div></div>text</div>' );
	} );
} );
