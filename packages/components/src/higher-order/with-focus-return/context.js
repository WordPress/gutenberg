/**
 * External dependencies
 */
import { uniq } from 'lodash';

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

		// Push the focused element to the history stack, keeping only unique
		// members but preferring the _last_ occurrence of any duplicates.
		// Lodash's `uniq` behavior favors the first occurrence, so the array
		// is temporarily reversed prior to it being called upon. Uniqueness
		// helps avoid situations where, such as in a constrained tabbing area,
		// the user changes focus enough within a transient element that the
		// stack may otherwise only consist of members pending destruction, at
		// which point focus might have been lost.
		const nextFocusHistory = uniq(
			[ ...focusHistory, event.target ]
				.slice( -1 * MAX_STACK_LENGTH )
				.reverse()
		).reverse();

		this.setState( { focusHistory: nextFocusHistory } );
	}

	render() {
		const { children, className } = this.props;

		return (
			<Provider value={ this.state }>
				<div onFocus={ this.onFocus } className={ className }>
					{ children }
				</div>
			</Provider>
		);
	}
}

export default FocusReturnProvider;
export { Consumer };
