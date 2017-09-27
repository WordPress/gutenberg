/**
 * WordPress dependency
 */
import { registerReducer, registerSelectors } from '@wordpress/data';

/**
 * Internal dependency
 */
import {
	getFrozenBlockCollaboratorColor,
	getFrozenBlockCollaboratorName,
	isBlockFrozenByCollaborator,
	isCoeditingEnabled,
	reducer,
	REDUCER_KEY,
} from './store';

registerReducer( REDUCER_KEY, reducer );

registerSelectors( REDUCER_KEY, {
	getFrozenBlockCollaboratorColor,
	getFrozenBlockCollaboratorName,
	isBlockFrozenByCollaborator,
	isCoeditingEnabled,
} );

import './hooks';
