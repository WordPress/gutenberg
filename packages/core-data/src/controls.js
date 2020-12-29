export function regularFetch( url ) {
	return {
		type: 'REGULAR_FETCH',
		url,
	};
}
const controls = {
	async REGULAR_FETCH( { url } ) {
		const { data } = await window
			.fetch( url )
			.then( ( res ) => res.json() );

		return data;
	},
};

export default controls;
