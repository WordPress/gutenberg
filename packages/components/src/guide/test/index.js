/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Guide from '../';
import PageControl from '../page-control';
import Modal from '../../modal';

describe( 'Guide', () => {
	it( 'renders nothing when there are no pages', () => {
		const wrapper = shallow( <Guide /> );
		expect( wrapper.isEmptyRender() ).toBe( true );
	} );

	it( 'renders one page at a time', () => {
		const wrapper = shallow(
			<Guide
				pages={ [
					{ content: <p>Page 1</p> },
					{ content: <p>Page 2</p> },
				] }
			/>
		);
		expect( wrapper.find( 'p' ) ).toHaveLength( 1 );
	} );

	it( 'hides back button and shows forward button on the first page', () => {
		const wrapper = shallow(
			<Guide
				pages={ [
					{ content: <p>Page 1</p> },
					{ content: <p>Page 2</p> },
				] }
			/>
		);
		expect( wrapper.find( PageControl ).prop( 'currentPage' ) ).toBe( 0 );
		expect( wrapper.find( '.components-guide__back-button' ) ).toHaveLength(
			0
		);
		expect(
			wrapper.find( '.components-guide__forward-button' )
		).toHaveLength( 1 );
		expect(
			wrapper.find( '.components-guide__finish-button' )
		).toHaveLength( 0 );
	} );

	it( 'shows back button and shows finish button on the last page', () => {
		const wrapper = shallow(
			<Guide
				pages={ [
					{ content: <p>Page 1</p> },
					{ content: <p>Page 2</p> },
				] }
			/>
		);
		wrapper.find( '.components-guide__forward-button' ).simulate( 'click' );
		expect( wrapper.find( PageControl ).prop( 'currentPage' ) ).toBe( 1 );
		expect( wrapper.find( '.components-guide__back-button' ) ).toHaveLength(
			1
		);
		expect(
			wrapper.find( '.components-guide__forward-button' )
		).toHaveLength( 0 );
		expect(
			wrapper.find( '.components-guide__finish-button' )
		).toHaveLength( 1 );
	} );

	it( "doesn't display the page control if there is only one page", () => {
		const wrapper = shallow(
			<Guide pages={ [ { content: <p>Page 1</p> } ] } />
		);
		expect( wrapper.find( PageControl ).exists() ).toBeFalsy();
	} );

	it( 'calls onFinish when the finish button is clicked', () => {
		const onFinish = jest.fn();
		const wrapper = shallow(
			<Guide
				onFinish={ onFinish }
				pages={ [ { content: <p>Page 1</p> } ] }
			/>
		);
		wrapper.find( '.components-guide__finish-button' ).simulate( 'click' );
		expect( onFinish ).toHaveBeenCalled();
	} );

	it( 'calls onFinish when the modal is closed', () => {
		const onFinish = jest.fn();
		const wrapper = shallow(
			<Guide
				onFinish={ onFinish }
				pages={ [ { content: <p>Page 1</p> } ] }
			/>
		);
		wrapper.find( Modal ).prop( 'onRequestClose' )();
		expect( onFinish ).toHaveBeenCalled();
	} );
} );
