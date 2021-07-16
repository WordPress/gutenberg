/**
 * Internal dependencies
 */
import matchPath from './match-path';
import RouterContext from './router-context';

/**
 * WordPress dependencies
 */
import {
	Children,
	cloneElement,
	Component,
	isValidElement,
} from '@wordpress/element';

/**
 * The public API for rendering the first <Route> that matches.
 */
class Switch extends Component {
	render() {
		return (
			<RouterContext.Consumer>
				{ ( context ) => {
					const location = this.props.location || context.location;

					let element, match;

					// We use React.Children.forEach instead of React.Children.toArray().find()
					// here because toArray adds keys to all child elements and we do not want
					// to trigger an unmount/remount for two <Route>s that render the same
					// component at different URLs.
					Children.forEach( this.props.children, ( child ) => {
						// eslint-disable-next-line eqeqeq
						if ( match == null && isValidElement( child ) ) {
							element = child;

							const path = child.props.path || child.props.from;

							match = path
								? matchPath( location.pathname, {
										...child.props,
										path,
								  } )
								: context.match;
						}
					} );

					return match
						? cloneElement( element, {
								computedMatch: match,
								location,
						  } )
						: null;
				} }
			</RouterContext.Consumer>
		);
	}
}

export default Switch;
