/**
 * External dependencies
 */
import { AppRegistry } from 'react-native';
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { applyFilters, doAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { Component, cloneElement } from './react';

const render = ( element, id ) => {
	class App extends Component {
		constructor() {
			super( ...arguments );

			const parentProps = omit( this.props || {}, [ 'rootTag' ] );

			doAction( 'native.pre-render', parentProps );

			this.filteredProps = applyFilters(
				'native.block_editor_props',
				parentProps
			);
		}

		componentDidMount() {
			doAction( 'native.render', this.filteredProps );
		}

		render() {
			return cloneElement( element, this.filteredProps );
		}
	}

	AppRegistry.registerComponent( id, () => App );
};

/**
 * Render a given element on Native.
 * This actually returns a componentProvider that can be registered with `AppRegistry.registerComponent`
 *
 * @param {WPElement} element Element to render.
 */
export { render };
