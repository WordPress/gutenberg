/**
 * External dependencies
 */
import { setupServer } from 'msw/node';

/**
 * Internal dependencies
 */
import { handlers } from './handlers';

export const server = setupServer( ...handlers );
