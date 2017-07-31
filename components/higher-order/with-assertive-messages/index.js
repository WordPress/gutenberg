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
function withAssertiveMessages( WrappedComponent ) {
	return class extends Component {
		constructor() {
			super( ...arguments );
			this.debouncedSpeakAssertive = debounce( this.speakAssertive.bind( this ), 500 );
		}

		speakAssertive( message ) {
			wp.a11y.speak( message, 'assertive' );
		}

		componentWillUnmount() {
			this.debouncedSpeakAssertive.cancel();
		}

		render() {
			return (
				<WrappedComponent { ...this.props }
					speakAssertive={ this.speakAssertive }
					debouncedSpeakAssertive={ this.debouncedSpeakAssertive }
				/>
			);
		}
	};
}

export default withAssertiveMessages;
