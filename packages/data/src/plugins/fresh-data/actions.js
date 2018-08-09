
export function dataRequested( api, clientKey, resourceNames, time = new Date() ) {
	return {
		type: 'RESOURCES_REQUESTED',
		api,
		clientKey,
		resourceNames,
		time,
	};
}

export function dataReceived( api, clientKey, resources, time = new Date() ) {
	return {
		type: 'RESOURCES_RECEIVED',
		api,
		clientKey,
		resources,
		time,
	};
}
