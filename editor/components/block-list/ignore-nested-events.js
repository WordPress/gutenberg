/**
 * External dependencies
 */
import { reduce } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Component which renders a div with all passed props applied, replacing all
 * event prop handlers with a proxying event handler to capture and prevent
 * events from being handled by its ancestor IgnoreNestedEvents components by
 * testing the presence of a private flag value on the event object.
 *
 * @type {Component}
 */
class IgnoreNestedEvents extends Component {
	constructor() {
		super( ...arguments );

		this.proxyEvent = this.proxyEvent.bind( this );

		// The event map is responsible for tracking an event type to a React
		// component prop name, since it is easy to determine event type from
		// a React prop name, but not the other way around.
		this.eventMap = {};
	}

	/**
	 * General event handler which only calls to its original props callback if
	 * it has not already been handled by a descendant IgnoreNestedEvents.
	 *
	 * @param {Event} event Event object.
	 *
	 * @return {void}
	 */
	proxyEvent( event ) {
		// Skip if already handled (i.e. assume nested block)
		if ( event.nativeEvent._blockHandled ) {
			return;
		}

		// Assign into the native event, since React will reuse their synthetic
		// event objects and this property assignment could otherwise leak.
		//
		// See: https://reactjs.org/docs/events.html#event-pooling
		event.nativeEvent._blockHandled = true;

		// Invoke original prop handler
		const propKey = this.eventMap[ event.type ];
		this.props[ propKey ]( event );
	}

	render() {
		const eventHandlers = reduce( this.props, ( result, handler, key ) => {
			// Try to match prop key as event handler
			const match = key.match( /^on([A-Z][a-zA-Z]+)$/ );
			if ( match ) {
				// Re-map the prop to the local proxy handler to check whether
				// the event has already been handled.
				result[ key ] = this.proxyEvent;

				// Assign event -> propName into an instance variable, so as to
				// avoid re-renders which could be incurred either by setState
				// or in mapping values to a newly created function.
				this.eventMap[ match[ 1 ].toLowerCase() ] = key;
			}

			return result;
		}, {} );

		return <div { ...this.props } { ...eventHandlers } />;
	}
}

export default IgnoreNestedEvents;
