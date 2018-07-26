// [TEMPORARY]: Button uses React.forwardRef, added in react@16.3.0 but not yet
// supported by Enzyme as of enzyme-adapter-react-16@1.1.1 . This mock unwraps
// the ref forwarding, so any tests relying on this behavior will fail.
//
// See: https://github.com/airbnb/enzyme/issues/1604
// See: https://github.com/airbnb/enzyme/pull/1592/files

const { Component } = require( 'react' );
const { Button: RawButton } = require.requireActual( '../index' );

class Button extends Component {
	render() {
		return RawButton( this.props );
	}
}

export default Button;
