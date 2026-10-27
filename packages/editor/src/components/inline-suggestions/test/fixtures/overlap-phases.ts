/**
 * Which phases of the overlap plan have landed. A fixture of a phase that has
 * not landed is only checked against the oracle; the tests that drive it
 * through the real operations are skipped.
 *
 * When a phase lands, add it here. To run a phase's tests before then, set
 * `OVERLAP_PHASES`, for example `OVERLAP_PHASES=A npm run test:unit -- …`.
 */
import type { Phase } from './overlap-oracle';

export const LANDED_PHASES: Phase[] = [ 'current', 'A', 'B' ];

/**
 * Whether a phase has landed, or is forced on through `OVERLAP_PHASES`.
 *
 * @param phase Phase.
 * @return Whether its tests run.
 */
export function isPhaseLanded( phase: Phase ): boolean {
	const forced = ( process.env.OVERLAP_PHASES ?? '' )
		.split( ',' )
		.map( ( p ) => p.trim() );
	return LANDED_PHASES.includes( phase ) || forced.includes( phase );
}
