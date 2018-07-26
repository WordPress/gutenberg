const apiFetch = jest.fn( () => {
	return apiFetch.mockReturnValue;
} );
apiFetch.mockReturnValue = 'Mock this value by overriding apiFetch.mockReturnValue.';

export default apiFetch;
