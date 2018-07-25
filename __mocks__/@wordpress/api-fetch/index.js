const apiFetch = jest.fn( () => {
	return apiFetch.mockReturnValue;
} );
apiFetch.mockReturnValue = 'mock this value by overriding apiFetch.mockReturnValue';

export default apiFetch;
