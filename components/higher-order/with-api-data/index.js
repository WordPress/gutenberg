/**
 * External dependencies
 */
import balanced from 'balanced-match';
import { mapValues, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from 'element';

export function createEndpointTag( schema ) {
	return function( fragments, ...args ) {
		// Assign candidates as pairing from route paths, where first entry is
		// a working candidate to match fragments against, and the second entry
		// the original path value (to reference matched schema route)
		let candidates = [];
		for ( const path in schema.routes ) {
			if ( schema.routes.hasOwnProperty( path ) ) {
				candidates.push( [ path, path ] );
			}
		}

		let path = '';
		for ( let i = 0; i < fragments.length; i++ ) {
			const fragment = fragments[ i ];
			const arg = args[ i ];

			// Append to working path
			path += fragment;
			if ( undefined !== arg ) {
				path += arg;
			}

			candidates = candidates.filter( ( candidate ) => {
				let [ working ] = candidate;

				// Reject if does not start with fragment
				if ( working.indexOf( fragment ) !== 0 ) {
					return false;
				}

				working = working.substr( fragment.length );

				// Test argument for this fragment
				if ( undefined !== arg && null !== arg ) {
					if ( working[ 0 ] === '(' ) {
						// Check if route parameter exists
						const param = balanced( '(', ')', working );
						if ( ! param || param.start !== 0 ) {
							return false;
						}

						working = working.substr( param.end + 1 );
					} else {
						// Reject if simple argument and not immediately
						// following fragment
						if ( working.indexOf( arg ) !== 0 ) {
							return false;
						}

						working = working.substr( arg.length );
					}
				}

				// Update working candidate
				candidate[ 0 ] = working;

				return true;
			} );

			if ( ! candidates.length ) {
				return;
			}
		}

		// Return first candidate for which there is no remaining working text
		for ( let i = 0; i < candidates.length; i++ ) {
			const [ working, original ] = candidates[ i ];
			if ( ! working ) {
				return [ path, schema.routes[ original ] ];
			}
		}
	};
}

export default ( mapPropsToData ) => ( WrappedComponent ) => {
	class ApiDataComponent extends Component {
		constructor() {
			super( ...arguments );

			this.state = {};
		}

		componentWillMount() {
			this.isStillMounted = true;
			this.applyMapping( this.props );
		}

		componentWillReceiveProps( nextProps ) {
			this.applyMapping( nextProps );
		}

		componentWillUnmount() {
			this.isStillMounted = false;
		}

		setIntoDataProp( propName, values ) {
			this.setState( {
				...this.state,
				[ propName ]: {
					...this.state[ propName ],
					...values,
				},
			} );
		}

		fetchData( propName, path ) {
			const url = this.context.getApiRoot() + path.replace( /^\//, '' );

			this.setIntoDataProp( propName, { isLoading: true } );

			window.fetch( url, {
				credentials: 'include',
				// TODO: Nonce management
				headers: new window.Headers( {
					'X-WP-Nonce': this.context.getApiNonce(),
				} ),
			} ).then( ( response ) => response.json() ).then( ( value ) => {
				// Don't set state if component unmounted since request started
				if ( this.isStillMounted ) {
					this.setIntoDataProp( propName, {
						isLoading: false,
						value,
					} );
				}
			} );
		}

		applyMapping( props ) {
			const schema = this.context.getApiSchema();
			const endpoint = createEndpointTag( schema );
			const mapping = mapPropsToData( props, endpoint );
			const nextState = mapValues( mapping, ( result, propName ) => {
				if ( ! result ) {
					return;
				}

				const [ path, route ] = result;

				return route.methods.reduce( ( stateValue, method ) => {
					switch ( method ) {
						case 'GET':
							stateValue.get = this.fetchData.bind( this, propName, path );
							stateValue.get();
							break;
					}

					return stateValue;
				}, {} );
			} );

			this.setState( nextState );
		}

		render() {
			return <WrappedComponent { ...this.props } { ...this.state } />;
		}
	}

	// Derive display name from original component
	const { displayName = WrappedComponent.name || 'Component' } = WrappedComponent;
	ApiDataComponent.displayName = `api(${ displayName })`;

	ApiDataComponent.contextTypes = {
		getApiSchema: noop,
		getApiRoot: noop,
		getApiNonce: noop,
	};

	return ApiDataComponent;
};
