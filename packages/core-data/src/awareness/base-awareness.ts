/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { AwarenessState } from './awareness-state';
import { STORE_NAME as coreStore } from '../name';
import { generateCollaboratorInfo, areCollaboratorInfosEqual } from './utils';

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
		const currentUser = await resolveSelect( coreStore ).getCurrentUser();
		const collaboratorInfo = generateCollaboratorInfo( currentUser );
		this.setLocalStateField( 'collaboratorInfo', collaboratorInfo );
	}
}

export const baseEqualityFieldChecks = {
	collaboratorInfo: areCollaboratorInfosEqual,
};

export class BaseAwareness extends BaseAwarenessState< BaseState > {
	protected equalityFieldChecks = baseEqualityFieldChecks;
}
