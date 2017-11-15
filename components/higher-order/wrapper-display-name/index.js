/**
 * External dependencies
 */
import { startCase } from 'lodash';

export default function wrapperDisplayName( wrapperPrefix, WrappedComponent ) {
	const { displayName = WrappedComponent.name || 'Component' } = WrappedComponent;

	return `${ startCase( wrapperPrefix ) }(${ displayName })`;
}
