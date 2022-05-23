declare module 'rememo' {
	export default function createSelector< T extends Function >( fn: T, ...any ) : T;
}
