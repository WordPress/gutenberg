/**
 * External dependencies
 */
import createSelector from 'rememo';

function unique( array ) {
	return array.filter(
		( value, index, current ) => current.indexOf( value ) === index
	);
}

export const getGroups = createSelector(
	( state ) =>
		unique(
			Object.keys( state.commands ).concat(
				Object.keys( state.commandLoaders )
			)
		),
	( state ) => [ state.commands, state.commandLoaders ]
);
export const getCommands = createSelector(
	( state, group ) => Object.values( state.commands[ group ] ?? {} ),
	( state, group ) => [ state.commands[ group ] ]
);

export const getCommandLoaders = createSelector(
	( state, group ) => Object.values( state.commandLoaders[ group ] ?? {} ),
	( state, group ) => [ state.commandLoaders[ group ] ]
);

export function getCommandLoader( state, loaderName ) {
	const group = Object.keys( state.commandLoaders ).find(
		( currentGroup ) =>
			!! state.commandLoaders[ currentGroup ][ loaderName ]
	);

	if ( ! group ) {
		return null;
	}

	return state.commandLoaders[ group ][ loaderName ];
}
