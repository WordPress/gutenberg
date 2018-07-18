// [TEMPORARY]: Button uses React.forwardRef, added in react@16.3.0 but not yet
// supported by Enzyme as of enzyme-adapter-react-16@1.1.1 . This mock unwraps
// the ref forwarding, so any tests relying on this behavior will fail.
//
// See: https://github.com/airbnb/enzyme/issues/1604
// See: https://github.com/airbnb/enzyme/pull/1592/files
jest.mock( '../../packages/components/src/button', () => {
	const { Button: RawButton } = require.requireActual( '../../packages/components/src/button' );
	const { Component } = require( 'react' );

	return class Button extends Component {
		render() {
			return RawButton( this.props );
		}
	};
} );

jest.mock( '@wordpress/api-fetch', () => {
	const apiFetch = jest.fn( () => {
		return apiFetch.mockReturnValue;
	} );
	apiFetch.mockReturnValue = 'mock this value by overriding apiFetch.mockReturnValue';

	return apiFetch;
} );
