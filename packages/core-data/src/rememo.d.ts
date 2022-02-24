declare module 'rememo' {
	export default function createSelector< T extends Function >( select: T, makeKey?: any ) : T;
}
