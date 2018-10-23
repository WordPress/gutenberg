/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';

export const ifViewportMatches = () => createHigherOrderComponent(
	( Component ) => Component,
	'ifViewportMatches'
);

export const withViewportMatch = () => createHigherOrderComponent(
	( Component ) => Component,
	'withViewportMatch'
);
