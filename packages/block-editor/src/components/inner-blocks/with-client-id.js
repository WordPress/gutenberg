/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useBlockClientId } from '../block-edit';

const withClientId = createHigherOrderComponent(
	( WrappedComponent ) => ( props ) => {
		const clientId = useBlockClientId();
		return <WrappedComponent { ...props } clientId={ clientId } />;
	},
	'withClientId'
);

export default withClientId;
