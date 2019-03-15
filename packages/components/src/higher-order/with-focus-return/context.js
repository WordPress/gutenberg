/**
 * WordPress dependencies
 */
import { Component, createContext } from '@wordpress/element';

const { Provider, Consumer } = createContext( {
	focusHistory: [],
} );

Provider.displayName = 'FocusReturnProvider';
Consumer.displayName = 'FocusReturnConsumer';

/**
 * The maximum history length to capture for the focus stack. When exceeded,
 * items should be shifted from the stack for each consecutive push.
 *
 * @type {number}
 */
const MAX_STACK_LENGTH = 100;

class FocusReturnProvider extends Component {
	constructor() {
		super( ...arguments );

		this.onFocus = this.onFocus.bind( this );

		this.state = {
			focusHistory: [],
		};
	}

	onFocus( event ) {
		const { focusHistory } = this.state;
		const nextFocusHistory = [
			...focusHistory,
			event.target,
		].slice( -1 * MAX_STACK_LENGTH );

		this.setState( { focusHistory: nextFocusHistory } );
	}

	render() {
		return (
			<Provider value={ this.state }>
				<div onFocus={ this.onFocus }>
					{ this.props.children }
				</div>
			</Provider>
		);
	}
}

export default FocusReturnProvider;
export { Consumer };
