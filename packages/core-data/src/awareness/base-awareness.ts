import { resolveSelect } from '@wordpress/data';
import { AwarenessState } from './awareness-state';
import { STORE_NAME as coreStore } from '../name';
import {
	generateAnonymousCollaboratorInfo,
	generateCollaboratorInfo,
	isCurrentCollaborator,
	areCollaboratorInfosEqual,
} from './utils';
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
		let collaboratorInfo;

		try {
			const currentUser =
				await resolveSelect( coreStore ).getCurrentUser();
			collaboratorInfo = isCurrentCollaborator( currentUser )
				? generateCollaboratorInfo( currentUser )
				: generateAnonymousCollaboratorInfo( this.clientID );
		} catch {
			// User routes can be disabled independently of collaboration. Keep
			// awareness available with a session-scoped presentation identity.
			collaboratorInfo = generateAnonymousCollaboratorInfo(
				this.clientID
			);
		}

		this.setLocalStateField( 'collaboratorInfo', collaboratorInfo );
	}
}

export const baseEqualityFieldChecks = {
	collaboratorInfo: areCollaboratorInfosEqual,
};

export class BaseAwareness extends BaseAwarenessState< BaseState > {
	protected equalityFieldChecks = baseEqualityFieldChecks;
}
