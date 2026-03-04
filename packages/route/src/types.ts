/**
 * External dependencies
 */
import type { AnyRouter } from '@tanstack/react-router';

/**
 * Curated router instance type.
 *
 * Picks only the supported surface area from the underlying
 * router, so consumers don't depend on internal details.
 */
export type Router = Pick<
	AnyRouter,
	'state' | 'navigate' | 'subscribe' | 'invalidate' | 'options' | 'history'
>;
