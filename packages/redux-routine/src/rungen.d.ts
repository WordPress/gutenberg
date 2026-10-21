declare module 'rungen' {
	type Control = (
		value: any,
		next: any,
		iterate: any,
		yieldNext: ( result: unknown ) => void,
		yieldError: ( err: Error ) => void
	) => Promise< boolean > | boolean;

	function create(
		...args: any[]
	): (
		action: any,
		successCallback: ( result: any ) => void,
		errorCallaback: () => void
	) => void;
}
