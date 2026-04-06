/**
 * Internal dependencies
 */
import { POLLING_INTERVAL_BACKGROUND_TAB_IN_MS } from './config';

const MEDIUM_RTT_THRESHOLD_IN_MS = 500;
const SLOW_RTT_THRESHOLD_IN_MS = 1500;
const SUCCESSFUL_POLL_SAMPLE_SIZE = 3;

const successfulPollDurationsInMs: number[] = [];

function getIntervalMultiplierFromAverageRtt( averageRttInMs: number ): number {
	if ( averageRttInMs >= SLOW_RTT_THRESHOLD_IN_MS ) {
		return 10;
	}

	if ( averageRttInMs >= MEDIUM_RTT_THRESHOLD_IN_MS ) {
		return 4;
	}

	return 1;
}

export function clearSuccessfulPollDurations(): void {
	successfulPollDurationsInMs.splice( 0, successfulPollDurationsInMs.length );
}

export function getLatencyAwarePollingInterval( baseInterval: number ): number {
	if ( successfulPollDurationsInMs.length < SUCCESSFUL_POLL_SAMPLE_SIZE ) {
		return baseInterval;
	}

	const averageRttInMs =
		successfulPollDurationsInMs.reduce(
			( sum, durationInMs ) => sum + durationInMs,
			0
		) / successfulPollDurationsInMs.length;

	return Math.min(
		baseInterval * getIntervalMultiplierFromAverageRtt( averageRttInMs ),
		POLLING_INTERVAL_BACKGROUND_TAB_IN_MS
	);
}

export function recordSuccessfulPollDuration( durationInMs: number ): void {
	successfulPollDurationsInMs.push( durationInMs );

	if ( successfulPollDurationsInMs.length > SUCCESSFUL_POLL_SAMPLE_SIZE ) {
		successfulPollDurationsInMs.shift();
	}
}
