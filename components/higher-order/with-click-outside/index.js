/**
 * External dependencies
 */
import hoistNonReactStatic from 'hoist-non-react-statics';

/**
 * WordPress dependencies
 */
import { Component } from 'element';

export default ( WrappedComponent ) => {
	const componentName = WrappedComponent.displayName || WrappedComponent.name;

	class WithClickOutside extends Component {
		constructor( props, context ) {
			super( props, context );
			this.handleClickOutside = this.handleClickOutside.bind( this );
			this.setNodes = this.setNodes.bind( this );
		}

		componentDidMount() {
			document.addEventListener( 'click', this.handleClickOutside, true );
		}

		componentWillUnmount() {
			document.removeEventListener( 'click', this.handleClickOutside, true );
		}

		handleClickOutside( e ) {
			const domNode = this.__domNode;
			if (
					( ! domNode || ! domNode.contains( e.target ) ) &&
					typeof this.__wrappedComponent.handleClickOutside === 'function'
			) {
				this.__wrappedComponent.handleClickOutside( e );
			}
		}

		setNodes( component ) {
			const hasGetDOMNode = component && component.getDOMNode;
			this.__wrappedComponent = component;
			this.__domNode = hasGetDOMNode
				? component.getDOMNode()
				: component;
		}

		render() {
			return (
				<WrappedComponent { ...this.props } ref={ this.setNodes } />
			);
		}
	}

	WithClickOutside.displayName = `clickOutside(${ componentName })`;

	return hoistNonReactStatic( WithClickOutside, WrappedComponent );
};

