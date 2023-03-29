/**
 * External dependencies
 */
import createSelector from 'rememo';

const noop = () => {};

export const getCommands = createSelector(
	( state, page ) => Object.values( state.commands[ page ] ?? {} ),
	( state, page ) => [ state.commands[ page ] ]
);

export const getCommandLoader = createSelector(
	( state, page ) => state.commandLoaders[ page ] ?? noop,
	( state, page ) => [ state.commandLoaders[ page ] ]
);

export function getPagePlaceholder( state, page ) {
	return state.placeholders[ page ];
}
