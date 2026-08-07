/**
 * Internal dependencies
 */
import { createHttpPollingProvider } from '../http-polling/http-polling-provider';
import { setSyncApiPath } from '../http-polling/utils';
import { setLongPollMode } from '../http-polling/polling-manager';
import type { ProviderCreator } from '../../types';

/**
 * REST route the long-poll transport holds open (its server counterpart is
 * WP_HTTP_Long_Polling_Sync_Server).
 */
export const LONG_POLL_API_PATH = '/wp-sync/v1/long-poll';

/**
 * Transport slug (matches the server's WP_HTTP_Long_Polling_Sync_Server).
 */
export const HTTP_LONG_POLLING_TRANSPORT_SLUG = 'http-long-polling';

/**
 * Creates the HTTP long-polling provider.
 *
 * Long-polling is short-polling with the request HELD OPEN by the server
 * until it has something to deliver (or a wait budget elapses), so remote
 * updates arrive promptly without tight client polling. Rather than
 * duplicate the polling transport's room lifecycle, cursor tracking, retry,
 * awareness, engine stamping, and debug tap, this reuses the SAME manager
 * pointed at the held-open route with an immediate re-issue cadence. Both
 * are one site-wide transport (selected by a single config value), so the
 * shared manager only ever runs in one mode.
 *
 * @return {ProviderCreator} The long-polling provider creator.
 */
export function createHttpLongPollingProvider(): ProviderCreator {
	setSyncApiPath( LONG_POLL_API_PATH );
	setLongPollMode( true );
	return createHttpPollingProvider();
}
