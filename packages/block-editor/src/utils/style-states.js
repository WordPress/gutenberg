export const DEFAULT_STATE_VALUE = 'default';

export function hasViewportStyleStateValue( styleState ) {
	return (
		!! styleState?.viewport && styleState.viewport !== DEFAULT_STATE_VALUE
	);
}

export function hasPseudoStyleStateValue( styleState ) {
	return !! styleState?.pseudo && styleState.pseudo !== DEFAULT_STATE_VALUE;
}

export function hasStyleStateValue( styleState ) {
	return Object.values( styleState ?? {} ).some(
		( value ) => value && value !== DEFAULT_STATE_VALUE
	);
}
