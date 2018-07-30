/**
 * External dependencies
 */
import { forOwn, compact, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';

/**
 * Set of deprecated UID props, where each key is the deprecated prop, its
 * value the equivalent replacement.
 *
 * @type {Object}
 */
const DEPRECATED_UID_PROPS = {
	lastBlockUID: 'lastBlockClientId',
	rootUID: 'rootClientId',
	uid: 'clientId',
	uids: 'clientIds',
};

/**
 * A higher-order component which replaces any instance of deprecated "UID"
 * prop names with their updated equivalent prop, with a deprecated warning
 * encouraging the developer to update their usage before its pending removal.
 *
 * @param {WPComponent} WrappedComponent Original component.
 *
 * @return {WPComponent} Enhanced component.
 */
export default createHigherOrderComponent( ( WrappedComponent ) => ( props ) => {
	forOwn( DEPRECATED_UID_PROPS, ( replacement, prop ) => {
		if ( ! props.hasOwnProperty( prop ) ) {
			return;
		}

		// Construct deprecated message, including original component's name
		// if possible to retrieve.
		const { name = WrappedComponent.displayName } = WrappedComponent;
		const message = compact( [
			name,
			`The \`${ prop }\` prop`,
		] ).join( ' ' );

		deprecated( message, {
			alternative: `the \`${ replacement }\` prop`,
			plugin: 'Gutenberg',
			version: 'v3.5',
		} );

		props = Object.assign( omit( props, prop ), {
			[ replacement ]: props[ prop ],
		} );
	} );

	return <WrappedComponent { ...props } />;
} );
