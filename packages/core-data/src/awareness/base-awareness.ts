/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { AwarenessState } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { STORE_NAME as coreStore } from '../name';
import { generateUserInfo, areUserInfosEqual } from './utils';

import type { BaseState } from './types';

export abstract class BaseAwarenessState<
	State extends BaseState,
> extends AwarenessState< State > {
	protected onSetUp(): void {
		void this.setCurrentUserInfo();
	}

	/**
	 * Set the current user info in the local state.
	 */
	private async setCurrentUserInfo(): Promise< void > {
		const states = this.getStates();
		const otherUserColors = Array.from( states.entries() )
			.filter(
				( [ clientId, state ] ) =>
					state.userInfo && clientId !== this.clientID
			)
			.map( ( [ , state ] ) => state.userInfo.color )
			.filter( Boolean );

		// Get current user info and set it in local state.
		const currentUser = await resolveSelect( coreStore ).getCurrentUser();
		const userInfo = generateUserInfo( currentUser, otherUserColors );
		this.setLocalStateField( 'userInfo', userInfo );
	}
}

export const baseEqualityFieldChecks = {
	userInfo: areUserInfosEqual,
};

export class BaseAwareness extends BaseAwarenessState< BaseState > {
	protected equalityFieldChecks = baseEqualityFieldChecks;
}
