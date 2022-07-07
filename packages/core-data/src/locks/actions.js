/**
 * Internal dependencies
 */
import createLocks from './engine';

export default function createLocksActions() {
	const locks = createLocks();

	function __unstableAcquireStoreLock( store, path, { exclusive } ) {
		return () => locks.acquire( store, path, exclusive );
	}

	function __unstableReleaseStoreLock( lock ) {
		return () => locks.release( lock );
	}

	return { __unstableAcquireStoreLock, __unstableReleaseStoreLock };
}
