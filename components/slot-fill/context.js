/**
 * External dependencies
 */
import { without } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Slot/Fill context.
 *
 * NOTE: In React 16.3.0, this will be assigned via new `createContext` API.
 *
 * @type {Object}
 */
const SlotFillContext = {};

/**
 * Currently mounted consumer instances.
 *
 * NOTE: In React 16.3.0, this will not be needed.
 *
 * @type {Array}
 */
let consumers = [];

/**
 * Current context.
 *
 * NOTE: In React 16.3.0, this will not be needed.
 *
 * @type {Object}
 */
let context;

/**
 * Triggers a forced render for all context consumers.
 *
 * NOTE: In React 16.3.0, this will not be needed.
 */
export function __interopForceUpdateConsumers() {
	consumers.forEach( ( instance ) => instance.forceUpdate() );
}

/**
 * Updates the current context and triggers a forced render on consumers.
 *
 * NOTE: In React 16.3.0, this will not be needed.
 *
 * @param {Object} nextContext Next context object.
 */
export function __interopSetContext( nextContext ) {
	context = nextContext;
	__interopForceUpdateConsumers();
}

SlotFillContext.Consumer = class extends Component {
	componentDidMount() {
		consumers.push( this );
	}

	componentWillUnmount() {
		consumers = without( consumers, this );
	}

	render() {
		return this.props.children( context );
	}
};

export default SlotFillContext;
