/**
 * @jest-environment node
 */

/**
 * External dependencies
 */
import { renderToString } from 'react-dom/server';

/**
 * Internal dependencies
 */
import useMediaQuery from '../';
import useViewportMatch from '../../use-viewport-match';

const MediaQueryComponent = ( { query } ) => {
	const result = useMediaQuery( query );
	return `useMediaQuery: ${ result }`;
};

const ViewportMatchComponent = ( { breakpoint, operator } ) => {
	const result = useViewportMatch( breakpoint, operator );
	return `useViewportMatch: ${ result }`;
};

describe( 'compose hooks in a server (no-window) environment', () => {
	it( 'useMediaQuery renders to false without throwing when window is undefined', () => {
		expect( typeof window ).toBe( 'undefined' );
		expect(
			renderToString( <MediaQueryComponent query="(min-width: 782px)" /> )
		).toBe( 'useMediaQuery: false' );
	} );

	it( 'useMediaQuery renders to false when no query is provided', () => {
		expect( renderToString( <MediaQueryComponent /> ) ).toBe(
			'useMediaQuery: false'
		);
	} );

	it( 'useViewportMatch renders to false without throwing when window is undefined', () => {
		expect(
			renderToString(
				<ViewportMatchComponent breakpoint="small" operator=">=" />
			)
		).toBe( 'useViewportMatch: false' );
	} );
} );
