/**
 * External dependencies
 */
import TestUtils from 'react-dom/test-utils';

/**
 * Internal dependencies
 */
import Dropdown from '../';

describe( 'Dropdown', () => {
	const expectPopoverVisible = ( wrapper, visible ) => {
		expect(
			TestUtils.scryRenderedDOMComponentsWithClass(
				wrapper,
				'components-popover'
			)
		).toHaveLength( visible ? 1 : 0 );
	};
	const buttonElement = ( wrapper ) =>
		TestUtils.findRenderedDOMComponentWithTag( wrapper, 'button' );
	const openCloseElement = ( wrapper, className ) =>
		TestUtils.findRenderedDOMComponentWithClass( wrapper, className );

	it( 'should toggle the dropdown properly', () => {
		const expectButtonExpanded = ( wrapper, expanded ) => {
			expect(
				TestUtils.scryRenderedDOMComponentsWithTag( wrapper, 'button' )
			).toHaveLength( 1 );
			expect(
				buttonElement( wrapper ).getAttribute( 'aria-expanded' )
			).toBe( expanded.toString() );
		};

		const wrapper = TestUtils.renderIntoDocument(
			<Dropdown
				className="container"
				contentClassName="content"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<button aria-expanded={ isOpen } onClick={ onToggle }>
						Toggleee
					</button>
				) }
				renderContent={ () => <span>test</span> }
			/>
		);

		expectButtonExpanded( wrapper, false );
		expectPopoverVisible( wrapper, false );

		TestUtils.Simulate.click( buttonElement( wrapper ) );

		expectButtonExpanded( wrapper, true );
		expectPopoverVisible( wrapper, true );
	} );

	it( 'should close the dropdown when calling onClose', () => {
		const wrapper = TestUtils.renderIntoDocument(
			<Dropdown
				className="container"
				contentClassName="content"
				renderToggle={ ( { isOpen, onToggle, onClose } ) => [
					<button
						key="open"
						className="open"
						aria-expanded={ isOpen }
						onClick={ onToggle }
					>
						Toggleee
					</button>,
					<button key="close" className="close" onClick={ onClose }>
						closee
					</button>,
				] }
				renderContent={ () => null }
			/>
		);

		expectPopoverVisible( wrapper, false );

		TestUtils.Simulate.click( openCloseElement( wrapper, 'open' ) );

		expectPopoverVisible( wrapper, true );

		TestUtils.Simulate.click( openCloseElement( wrapper, 'close' ) );

		expectPopoverVisible( wrapper, false );
	} );
} );
