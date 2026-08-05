/**
 * Type declarations for sync-id.js (block identity minting). See
 * engine-types.d.ts for the lockstep discipline.
 */

export function canonicalGenesisInput(
	revision: { postId: number; revisionId: number },
	path: number[]
): string;

export function genesisSyncId(
	revision: { postId: number; revisionId: number },
	path: number[]
): string;

export function mintSyncId( random?: () => number ): string;
