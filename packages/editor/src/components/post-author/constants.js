export const AUTHORS_QUERY = {
	who: 'authors',
	per_page: 50,
	_fields: 'id,name',
	context: 'view', // Allows non-admins to perform requests.
};
