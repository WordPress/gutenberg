import createLocks from './engine';
import type { Lock, LockPath } from './types';

export default function createLocksActions() {
	const locks = createLocks();

	function __unstableAcquireStoreLock(
		store: string,
		path: LockPath,
		{ exclusive }: { exclusive: boolean }
	) {
		return () => locks.acquire( store, path, exclusive );
	}

	function __unstableReleaseStoreLock( lock: Lock ) {
		return () => locks.release( lock );
	}

	return { __unstableAcquireStoreLock, __unstableReleaseStoreLock };
}
