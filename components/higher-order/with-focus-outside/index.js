/**
 * External dependencies
 */
import hoistNonReactStatic from 'hoist-non-react-statics';

/**
 * WordPress dependencies
 */
import { Component, findDOMNode } from '@wordpress/element';

/* Heavily based on react-click-outside (https://github.com/kentor/react-click-outside/blob/master/index.js),
 * this Higher Order Component wraps a component and fires any handleFocusOutside listeners it might have
 * if a focus is detected ouside that component
 *
 * @param {WPElement} OriginalComponent the original component
 *
 * @return {Component} Component with focus outside detection
 */

function withFocusOutside( OriginalComponent ) {
	const componentName = OriginalComponent.displayName || OriginalComponent.name;

	class EnhancedComponent extends Component {
		constructor() {
			super( ...arguments );
			this.onFocusOutside = this.onFocusOutside.bind( this );
			this.bindRef = this.bindRef.bind( this );
		}

		componentDidMount() {
			document.addEventListener( 'focusin', this.onFocusOutside, true );
		}

		componentWillUnmount() {
			document.removeEventListener( 'focusin', this.onFocusOutside, true );
		}

		onFocusOutside( e ) {
			const domNode = this.__domNode;
			if (
				( ! domNode || ! domNode.contains( e.target ) ) &&
				typeof this.__wrappedInstance.handleFocusOutside === 'function'
			) {
				this.__wrappedInstance.handleFocusOutside( e );
			}
		}

		bindRef( ref ) {
			this.__wrappedInstance = ref;
			// eslint-disable-next-line react/no-find-dom-node
			this.__domNode = findDOMNode( ref );
		}

		render() {
			return (
				<OriginalComponent
					{ ...this.props }
					ref={ this.bindRef }
				/>
			);
		}
	}

	EnhancedComponent.displayName = `FocusOutside(${ componentName })`;

	return hoistNonReactStatic( EnhancedComponent, OriginalComponent );
}

export default withFocusOutside;
