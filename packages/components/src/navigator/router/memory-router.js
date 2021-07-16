/**
 * External dependencies
 */
import { createMemoryHistory as createHistory } from 'history';

/**
 * Internal dependencies
 */
import Router from './router';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * The public API for a <Router> that stores location in memory.
 */
class MemoryRouter extends Component {
	constructor() {
		super();

		this.history = createHistory( this.props );
	}

	render() {
		return (
			<Router children={ this.props.children } history={ this.history } />
		);
	}
}

export default MemoryRouter;
