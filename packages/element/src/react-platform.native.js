/**
 * External dependencies
 */
import { AppRegistry } from 'react-native';
import { isEmpty, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { applyFilters, doAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { cloneElement } from './react';

const render = ( element, id ) =>
	AppRegistry.registerComponent( id, () => ( propsFromParent ) => {
		const parentProps = omit( propsFromParent || {}, [ 'rootTag' ] );
		let filteredProps;

		doAction( 'native.pre-render', parentProps );

		// If we have not received props from the parent app, we're in the demo app
		if ( isEmpty( parentProps ) ) {
			filteredProps = applyFilters(
				'native.block_editor_props_default',
				element.props
			);
		} else {
			filteredProps = applyFilters(
				'native.block_editor_props_from_parent',
				parentProps
			);
		}

		filteredProps = applyFilters(
			'native.block_editor_props',
			filteredProps
		);

		doAction( 'native.render', filteredProps );

		return cloneElement( element, filteredProps );
	} );

/**
 * Render a given element on Native.
 * This actually returns a componentProvider that can be registered with `AppRegistry.registerComponent`
 *
 * @param {WPElement}   element Element to render.
 */
export { render };
