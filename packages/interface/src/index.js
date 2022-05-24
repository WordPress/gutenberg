export * from './components';
export { store } from './store';

export const secretKey = process.env.WP_SECRET_KEY;

export function createExperiments( experiments ) {
	return function ( name, key ) {
		if ( secretKey !== key ) {
			throw new Error( 'Experiments are not supported.' );
		}
		return experiments[ name ];
	};
}
