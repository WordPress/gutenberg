/**
 * Internal dependencies
 */
import type { PageUtils } from './';

interface NetworkConditions {
	/**
	 * True to emulate internet disconnection.
	 */
	offline: boolean;
	/**
	 * Minimum latency from request sent to response headers received (ms).
	 */
	latency: number;
	/**
	 * Maximal aggregated download throughput (bytes/sec). -1 disables download throttling.
	 */
	downloadThroughput: number;
	/**
	 * Maximal aggregated upload throughput (bytes/sec).  -1 disables upload throttling.
	 */
	uploadThroughput: number;
}

// Defaults from https://github.com/puppeteer/puppeteer/blob/401355610874beac23a51dcb75739a4bb4191a2b/packages/puppeteer-core/src/cdp/PredefinedNetworkConditions.ts.
const PredefinedNetworkConditions: Record< string, NetworkConditions > = {
	// Generally aligned with DevTools
	// https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/core/sdk/NetworkManager.ts;l=398;drc=225e1240f522ca684473f541ae6dae6cd766dd33.
	'Slow 3G': {
		offline: false,
		// ~500Kbps down
		downloadThroughput: ( ( 500 * 1000 ) / 8 ) * 0.8,
		// ~500Kbps up
		uploadThroughput: ( ( 500 * 1000 ) / 8 ) * 0.8,
		// 400ms RTT
		latency: 400 * 5,
	},
	'Fast 3G': {
		offline: false,
		// ~1.6 Mbps down
		downloadThroughput: ( ( 1.6 * 1000 * 1000 ) / 8 ) * 0.9,
		// ~0.75 Mbps up
		uploadThroughput: ( ( 750 * 1000 ) / 8 ) * 0.9,
		// 150ms RTT
		latency: 150 * 3.75,
	},
	// alias to Fast 3G to align with Lighthouse (crbug.com/342406608)
	// and DevTools (crbug.com/342406608),
	'Slow 4G': {
		offline: false,
		// ~1.6 Mbps down
		downloadThroughput: ( ( 1.6 * 1000 * 1000 ) / 8 ) * 0.9,
		// ~0.75 Mbps up
		uploadThroughput: ( ( 750 * 1000 ) / 8 ) * 0.9,
		// 150ms RTT
		latency: 150 * 3.75,
	},
	'Fast 4G': {
		offline: false,
		// 9 Mbps down
		downloadThroughput: ( ( 9 * 1000 * 1000 ) / 8 ) * 0.9,
		// 1.5 Mbps up
		uploadThroughput: ( ( 1.5 * 1000 * 1000 ) / 8 ) * 0.9,
		// 60ms RTT
		latency: 60 * 2.75,
	},
	/**
	 * Network conditions used for desktop in Lighthouse/PSI.
	 *
	 * 10,240 kb/s throughput with 40 ms TCP RTT.
	 *
	 * @see https://github.com/paulirish/lighthouse/blob/f0855904aaffaecf3089169449646960782d7e92/core/config/constants.js#L40-L49
	 * @see https://docs.google.com/document/d/1-p4HSp42REEA5-jCBVB6PqQcVhI1nQIblBCNKhPJUXg/edit?tab=t.0#heading=h.jsap7yf4phk6
	 */
	Broadband: {
		offline: false,
		downloadThroughput: ( 10240 * 1000 ) / 8,
		uploadThroughput: ( 10240 * 1000 ) / 8,
		latency: 40,
	},
};

export async function emulateNetworkConditions(
	this: PageUtils,
	condition: keyof typeof PredefinedNetworkConditions | NetworkConditions
) {
	if ( 'chromium' !== this.browserName ) {
		throw new Error(
			'CDP sessions are only supported on Chromium-based browsers'
		);
	}

	const session = await this.page.context().newCDPSession( this.page );
	await session.send(
		'Network.emulateNetworkConditions',
		'string' === typeof condition
			? PredefinedNetworkConditions[ condition ]
			: condition
	);
	await session.detach();
}
