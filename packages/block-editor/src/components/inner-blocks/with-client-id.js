/**
 * External dependencies
 */
import { pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { withBlockEditContext } from '../block-edit/context';

const withClientId = createHigherOrderComponent(
	( WrappedComponent ) =>
		withBlockEditContext( ( context ) => pick( context, [ 'clientId' ] ) )(
			WrappedComponent
		),
	'withClientId'
);

export default withClientId;
