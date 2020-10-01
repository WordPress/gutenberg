const stringsToAdd = [];

export const addStrings = ( newStrings ) => stringsToAdd.unshift( newStrings );

const getStrings = () =>
	stringsToAdd.reduce( ( previous, current ) => {
		return { ...previous, ...current() };
	}, {} );

export const withUIStrings = ( WrappedComponent ) => ( props ) => (
	<WrappedComponent { ...props } uiStrings={ getStrings() } />
);
