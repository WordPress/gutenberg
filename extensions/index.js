/**
 * External dependencies
 */
import { forEach, flowRight, without } from 'lodash';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { createElement, Component } from 'element';

function connectExtensionState( name ) {
	return connect(
		( state ) => ( {
			extensionState: state.extensions[ name ] || {},
		} ),
		{
			setExtensionState: ( state ) => {
				return {
					type: '@@EXTENSIONS/SET_EXTENSION_STATE',
					name,
					state,
				};
			},
		}
	);
}

export function applyComponentDecorators( WrappedComponent ) {
	class DecoratedComponent extends Component {
		static addDecorator( name, decorator ) {
			const { instances, decorators } = this._extensions;

			decorators.push( flowRight( connectExtensionState( name ), decorator ) );

			this._extensions.DecoratedComponent = flowRight( ...decorators )( WrappedComponent );
			instances.forEach( ( instance ) => instance.forceUpdate() );
		}

		componentDidMount() {
			this.constructor._extensions.instances.push( this );
		}

		componentWillUnmount() {
			this.constructor._extensions.instances = without(
				this.constructor._extensions.instances,
				this
			);
		}

		render() {
			return createElement(
				this.constructor._extensions.DecoratedComponent,
				this.props
			);
		}
	}

	DecoratedComponent._extensions = {
		decorators: [],
		instances: [],
		DecoratedComponent: WrappedComponent,
	};

	return DecoratedComponent;
}

export function decorateComponent( DecoratedComponent, name, decorator ) {
	if ( ! DecoratedComponent.addDecorator ) {
		throw new TypeError( 'The provided component has not enabled decorators' );
	}

	DecoratedComponent.addDecorator( name, decorator );
}

export function registerExtension( name, settings ) {
	forEach( settings.decorators, ( [ DecoratedComponent, decorator ] ) => {
		decorateComponent( DecoratedComponent, name, decorator );
	} );
}

export function extensionsReducer( state = {}, action ) {
	switch ( action.type ) {
		case '@@EXTENSIONS/SET_EXTENSION_STATE':
			state = {
				...state,
				[ action.name ]: {
					...state[ action.name ],
					...action.state,
				},
			};
	}

	return state;
}

export default {
	applyComponentDecorators,
	decorateComponent,
	extensionsReducer,
};
