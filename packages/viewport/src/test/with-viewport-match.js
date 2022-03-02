/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { useViewportMatch as useViewportMatchMock } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import '../store';
import withViewportMatch from '../with-viewport-match';

describe( 'withViewportMatch()', () => {
	afterEach( () => {
		useViewportMatchMock.mockClear();
	} );

	const ChildComponent = () => <div>Hello</div>;

	// This is needed because TestUtils does not accept a stateless component.
	// anything run through a HOC ends up as a stateless component.
	const getTestComponent = ( WrappedComponent ) => {
		class TestComponent extends Component {
			render() {
				return <WrappedComponent { ...this.props } />;
			}
		}
		return <TestComponent />;
	};

	it( 'should render with result of query as custom prop name', () => {
		const EnhancedComponent = withViewportMatch( {
			isWide: '>= wide',
			isSmall: '>= small',
			isLarge: 'large',
			isLessThanSmall: '< small',
		} )( ChildComponent );

		useViewportMatchMock.mockReturnValueOnce( false );
		useViewportMatchMock.mockReturnValueOnce( true );
		useViewportMatchMock.mockReturnValueOnce( true );
		useViewportMatchMock.mockReturnValueOnce( false );

		const wrapper = renderer.create(
			getTestComponent( EnhancedComponent )
		);

		expect( useViewportMatchMock.mock.calls ).toEqual( [
			[ 'wide', '>=' ],
			[ 'small', '>=' ],
			[ 'large', '>=' ],
			[ 'small', '<' ],
		] );

		const { props } = wrapper.root.findByType( ChildComponent );
		expect( props.isWide ).toBe( false );
		expect( props.isSmall ).toBe( true );
		expect( props.isLarge ).toBe( true );
		expect( props.isLessThanSmall ).toBe( false );

		wrapper.unmount();
	} );
} );
