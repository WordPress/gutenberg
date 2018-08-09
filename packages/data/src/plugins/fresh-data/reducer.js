
export function reduceRequested( state, action ) {
	const { resourceNames, time } = action;
	const apiState = state || {};
	const clientState = apiState.client || {};
	const existingResources = clientState.resources || {};

	const resources = resourceNames.reduce( ( newResources, resourceName ) => {
		const existingResource = existingResources[ resourceName ];
		newResources[ resourceName ] = { ...existingResource, lastRequested: time };
		return newResources;
	}, existingResources );

	return { ...state, client: { resources: resources } };
}

export function reduceReceived( state = {}, action ) {
	const { resources, time } = action;
	const apiState = state || {};
	const clientState = apiState.client || {};
	const existingResources = clientState.resources || {};

	const updatedResources = Object.keys( resources ).reduce( ( newResources, resourceName ) => {
		const existingResource = existingResources[ resourceName ];
		const resource = action.resources[ resourceName ];
		if ( resource.data ) {
			resource.lastReceived = time;
		}
		if ( resource.error ) {
			resource.lastError = time;
		}
		newResources[ resourceName ] = { ...existingResource, ...resource };
		return newResources;
	}, existingResources );

	return { ...state, client: { resources: updatedResources } };
}

const reducer = ( state = {}, action ) => {
	switch ( action.type ) {
		case 'RESOURCES_REQUESTED':
			return reduceRequested( state, action );
		case 'RESOURCES_RECEIVED':
			return reduceReceived( state, action );
		default:
			return state;
	}
};

export default reducer;
