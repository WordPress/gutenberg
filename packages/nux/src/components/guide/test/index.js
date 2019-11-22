/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { Guide, Page } from '../';
import PageControl from '../page-control';

describe( 'Guide', () => {
	it( 'renders nothing when there are no pages', () => {
		const wrapper = shallow( <Guide /> );
		expect( wrapper.isEmptyRender() ).toBe( true );
	} );

	it( 'renders when there are pages', () => {
		const wrapper = shallow(
			<Guide>
				<Page>Page 1</Page>
				<Page>Page 2</Page>
			</Guide>
		);
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'hides back button and shows forward button on the first page', () => {
		const wrapper = shallow(
			<Guide>
				<Page>Page 1</Page>
				<Page>Page 2</Page>
			</Guide>
		);
		expect( wrapper.find( PageControl ).prop( 'currentPage' ) ).toBe( 0 );
		expect( wrapper.find( '.nux-guide__back-button' ) ).toHaveLength( 0 );
		expect( wrapper.find( '.nux-guide__forward-button' ) ).toHaveLength( 1 );
		expect( wrapper.find( '.nux-guide__finish-button' ) ).toHaveLength( 0 );
	} );

	it( 'shows back button and shows finish button on the last page', () => {
		const wrapper = shallow(
			<Guide>
				<Page>Page 1</Page>
				<Page>Page 2</Page>
			</Guide>
		);
		wrapper.find( '.nux-guide__forward-button' ).simulate( 'click' );
		expect( wrapper.find( PageControl ).prop( 'currentPage' ) ).toBe( 1 );
		expect( wrapper.find( '.nux-guide__back-button' ) ).toHaveLength( 1 );
		expect( wrapper.find( '.nux-guide__forward-button' ) ).toHaveLength( 0 );
		expect( wrapper.find( '.nux-guide__finish-button' ) ).toHaveLength( 1 );
	} );

	it( 'shows the finish button inline with the content on mobile', () => {
		const wrapper = shallow(
			<Guide isMobile>
				<Page>Page 1</Page>
			</Guide>
		);
		expect( wrapper.find( '.nux-guide__finish-button' ) ).toHaveLength( 0 );
		expect( wrapper.findWhere( ( node ) => node.text() === 'Finish' ) ).toHaveLength( 1 );
	} );

	it( 'calls onFinish when the finish button is clicked', () => {
		const onFinish = jest.fn();
		const wrapper = shallow(
			<Guide onFinish={ onFinish }>
				<Page>Page 1</Page>
			</Guide>
		);
		wrapper.find( '.nux-guide__finish-button' ).simulate( 'click' );
		expect( onFinish ).toHaveBeenCalled();
	} );

	it( 'calls onFinish when the modal is closed', () => {
		const onFinish = jest.fn();
		const wrapper = shallow(
			<Guide onFinish={ onFinish }>
				<Page>Page 1</Page>
			</Guide>
		);
		wrapper.find( Modal ).prop( 'onRequestClose' )();
		expect( onFinish ).toHaveBeenCalled();
	} );
} );
