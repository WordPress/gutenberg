/**
 * Internal dependencies
 */
import HistoryContext from './history-context';
import RouterContext from './router-context';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * The public API for putting history on context.
 */
class Router extends Component {
	static computeRootMatch( pathname ) {
		return { isExact: pathname === '/', params: {}, path: '/', url: '/' };
	}

	constructor( props ) {
		super( props );

		this.state = {
			location: props.history.location,
		};

		// This is a bit of a hack. We have to start listening for location
		// changes here in the constructor in case there are any <Redirect>s
		// on the initial render. If there are, they will replace/push when
		// they mount and since cDM fires in children before parents, we may
		// get a new location before the <Router> is mounted.
		this._isMounted = false;
		this._pendingLocation = null;

		if ( ! props.staticContext ) {
			this.unlisten = props.history.listen( ( location ) => {
				if ( this._isMounted ) {
					this.setState( { location } );
				} else {
					this._pendingLocation = location;
				}
			} );
		}
	}

	componentDidMount() {
		this._isMounted = true;

		if ( this._pendingLocation ) {
			this.setState( { location: this._pendingLocation } );
		}
	}

	componentWillUnmount() {
		if ( this.unlisten ) {
			this.unlisten();
			this._isMounted = false;
			this._pendingLocation = null;
		}
	}

	render() {
		return (
			<RouterContext.Provider
				value={ {
					history: this.props.history,
					location: this.state.location,
					match: Router.computeRootMatch(
						this.state.location.pathname
					),
					staticContext: this.props.staticContext,
				} }
			>
				<HistoryContext.Provider
					children={ this.props.children || null }
					value={ this.props.history }
				/>
			</RouterContext.Provider>
		);
	}
}

export default Router;
