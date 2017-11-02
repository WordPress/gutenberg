/**
 * External dependencies
 */
import { noop } from 'lodash';

export default ( WrappedComponent ) => {
	function HooksComponent( props, context ) {
		return (
			<WrappedComponent
				{ ...props }
				{ ...context } />
		);
	}

	// Derive display name from original component
	const { displayName = WrappedComponent.name || 'Component' } = WrappedComponent;
	HooksComponent.displayName = `hooks(${ displayName })`;

	HooksComponent.contextTypes = {
		hooks: noop,
	};

	return HooksComponent;
};
