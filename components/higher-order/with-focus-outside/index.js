import hoistNonReactStatic from 'hoist-non-react-statics';
import { Component, findDOMNode } from '@wordpress/element';

/* Heavily inspired by react-click-outside
 * (https://github.com/kentor/react-click-outside/blob/master/index.js)
 */

function withFocusOutside( OriginalComponent ) {
	const componentName = OriginalComponent.displayName || OriginalComponent.name;

	class EnhancedComponent extends Component {
		constructor() {
			super( ...arguments );
			this.onFocusOutside = this.onFocusOutside.bind( this );
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

		bindRef( wrappedRefCallback, ref ) {
			this.__wrappedInstance = ref;
			// eslint-disable-next-line react/no-find-dom-node
			this.__domNode = findDOMNode( ref );
			if ( wrappedRefCallback ) {
				wrappedRefCallback( ref );
			}
		}

		render() {
			const { wrappedRef, ...rest } = this.props;
			return (
				<OriginalComponent
					{ ...rest }
					ref={ this.bindRef.bind( this, wrappedRef ) }
				/>
			);
		}
	}

	EnhancedComponent.displayName = `FocusOutside(${ componentName })`;

	return hoistNonReactStatic( EnhancedComponent, OriginalComponent );
}

export default withFocusOutside;
