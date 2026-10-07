export const BASE_QUERY = {
	_fields: 'id,name',
	context: 'view', // Allows non-admins to perform requests.
};

export const AUTHORS_QUERY = {
	who: 'authors',
	per_page: 100,
	...BASE_QUERY,
};
