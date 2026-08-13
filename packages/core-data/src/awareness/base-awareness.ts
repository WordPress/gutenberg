import { resolveSelect } from '@wordpress/data';
import { AwarenessState } from './awareness-state';
import { STORE_NAME as coreStore } from '../name';
import { generateCollaboratorInfo, areCollaboratorInfosEqual } from './utils';
import type { User } from '../entity-types';
import type { BaseState } from './types';

export abstract class BaseAwarenessState<
	State extends BaseState,
> extends AwarenessState< State > {
	protected onSetUp(): void {
		void this.setCurrentCollaboratorInfo();
	}

	/**
	 * Set the current collaborator info in the local state.
	 */
	private async setCurrentCollaboratorInfo(): Promise< void > {
		let currentUser: User< 'view' > | undefined;

		try {
			currentUser = await resolveSelect( coreStore ).getCurrentUser();
		} catch {
			// Any user-resolution failure leaves collaboration usable with a
			// fallback identity. Authorization remains the provider's responsibility.
		}

		this.setLocalStateField(
			'collaboratorInfo',
			generateCollaboratorInfo( currentUser, this.clientID )
		);
	}
}

export const baseEqualityFieldChecks = {
	collaboratorInfo: areCollaboratorInfosEqual,
};

export class BaseAwareness extends BaseAwarenessState< BaseState > {
	protected equalityFieldChecks = baseEqualityFieldChecks;
}
