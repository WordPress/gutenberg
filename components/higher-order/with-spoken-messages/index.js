/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from 'element';

/**
 * A Higher Order Component used to be provide a unique instance ID by component
 *
 * @param {WPElement}  WrappedComponent  The wrapped component
 *
 * @return {Component}                   Component with an instanceId prop.
 */
function withSpokenMessages( WrappedComponent ) {
	return class extends Component {
		constructor() {
			super( ...arguments );
			this.debouncedSpeak = debounce( this.speak.bind( this ), 500 );
		}

		speak( message, type = 'polite' ) {
			wp.a11y.speak( message, type );
		}

		componentWillUnmount() {
			this.debouncedSpeak.cancel();
		}

		render() {
			return (
				<WrappedComponent { ...this.props }
					speak={ this.speak }
					debouncedSpeak={ this.debouncedSpeak }
				/>
			);
		}
	};
}

export default withSpokenMessages;
