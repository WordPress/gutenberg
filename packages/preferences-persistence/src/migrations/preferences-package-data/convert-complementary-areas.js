export default function convertComplementaryAreas( state ) {
	return Object.keys( state ).reduce( ( stateAccumulator, scope ) => {
		const scopeData = state[ scope ];

		// If a complementary area is truthy, convert it to the `isComplementaryAreaVisible` boolean.
		if ( scopeData?.complementaryArea ) {
			const updatedScopeData = { ...scopeData };
			delete updatedScopeData.complementaryArea;
			updatedScopeData.isComplementaryAreaVisible = true;
			stateAccumulator[ scope ] = updatedScopeData;
			return stateAccumulator;
		}

		return stateAccumulator;
	}, state );
}
