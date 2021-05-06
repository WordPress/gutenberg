/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

export function regularFetch( url ) {
	return {
		type: 'REGULAR_FETCH',
		url,
	};
}

export function getDispatch() {
	return {
		type: 'GET_DISPATCH',
	};
}

const controls = {
	async REGULAR_FETCH( { url } ) {
		const { data } = await window
			.fetch( url )
			.then( ( res ) => res.json() );

		return data;
	},

	GET_DISPATCH: createRegistryControl( ( { dispatch } ) => () => dispatch ),
};

export default controls;
