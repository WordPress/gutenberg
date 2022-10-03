// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable jsdoc/check-tag-names */
/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import { useMemo } from 'preact/hooks';

/**
 * Internal dependencies
 */
import { deepSignal } from './deep-signal';
import { component } from './hooks';

export default () => {
	const WpContext = ( { children, data, context: { Provider } } ) => {
		const signals = useMemo( () => deepSignal( JSON.parse( data ) ), [] );
		return <Provider value={ signals }>{ children }</Provider>;
	};
	component( 'wp-context', WpContext );
};
