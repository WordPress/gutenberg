import { resolveSelect } from '@wordpress/data';
import { AwarenessState } from './awareness-state';
import { STORE_NAME as coreStore } from '../name';
import {
	generateFallbackCollaboratorInfo,
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
		const fallbackCollaboratorInfo = generateFallbackCollaboratorInfo(
			this.clientID
		);
		this.setLocalStateField( 'collaboratorInfo', fallbackCollaboratorInfo );

		try {
			const currentUser =
				await resolveSelect( coreStore ).getCurrentUser();
			if ( ! isCurrentCollaborator( currentUser ) ) {
				return;
			}

			this.setLocalStateField( 'collaboratorInfo', {
				...generateCollaboratorInfo( currentUser ),
				enteredAt: fallbackCollaboratorInfo.enteredAt,
			} );
		} catch {
			// User resolution can fail when the route is unavailable or because of
			// a temporary request failure. The fallback identity is already usable.
		}
	}
}

export const baseEqualityFieldChecks = {
	collaboratorInfo: areCollaboratorInfosEqual,
};

export class BaseAwareness extends BaseAwarenessState< BaseState > {
	protected equalityFieldChecks = baseEqualityFieldChecks;
}
