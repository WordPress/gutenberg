/**
 * External Dependencies
 */
import { isFunction } from 'lodash';

/**
 * WordPress Dependencies
 */
import { Component } from '@wordpress/element';

const createQueryHigherOrderComponent = ( client ) => ( mapPropsToQuery, mapPropsToVariables = () => ( {} ) ) => ( WrappedComponent ) => {
	return class GraphQueryComponent extends Component {
		constructor() {
			super( ...arguments );
			this.state = {
				data: null, errors: null,
			};
		}

		componentDidMount() {
			this.buildQuery( this.props );
			this.request();
		}

		componentWillUnmount() {
			this.cancelRequest();
		}

		componentWillReceiveProps( newProps ) {
			this.buildQuery( newProps );
			this.request();
		}

		buildQuery( props ) {
			if ( isFunction( mapPropsToQuery ) ) {
				this.query = mapPropsToQuery( props );
			} else {
				this.query = mapPropsToQuery;
			}
			this.variables = mapPropsToVariables( props );
		}

		cancelRequest() {
			if ( this.unsubscribe ) {
				this.unsubscribe();
			}
		}

		request() {
			this.cancelRequest();
			const query = client.query( { query: this.query, variables: this.variables } );
			const observer = query.subscribe( ( results ) => {
				this.setState( results );
			} );
			this.unsubscribe = observer.unsubscribe;
		}

		render() {
			return (
				<WrappedComponent { ...this.props } { ...this.state } />
			);
		}
	};
};

export default createQueryHigherOrderComponent;
