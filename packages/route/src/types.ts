/**
 * External dependencies
 */
import type { AnyRouter } from '@tanstack/react-router';

/**
 * Curated router instance type.
 */
export type Router = Pick<
	AnyRouter,
	'state' | 'navigate' | 'subscribe' | 'invalidate' | 'options' | 'history'
>;
