export const createAtom = ( initialValue ) => () => {
	const value = initialValue;

	return {
		type: 'root',
		get() {
			return value;
		},
	};
};
