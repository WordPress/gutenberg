/**
 * Simple loading logging redux middleware.
 *
 * @type {import('redux').Middleware}
 */

const formatLoadedEntry = ( action ) => {
	let formatted = action.selectorName;

	if ( action.args?.length ) {
		formatted += ': ' + JSON.stringify( action.args );
	}

	return formatted;
};

const getCurrentTime = () => {
	const date = new Date();
	return (
		date.getHours() +
		':' +
		date.getMinutes() +
		':' +
		date.getSeconds() +
		'.' +
		date.getMilliseconds()
	);
};

const actionTypeMap = {
	START_RESOLUTION: 'Started loading',
	START_RESOLUTIONS: 'Started bulk loading',
	FINISH_RESOLUTION: 'Finished loading',
	FINISH_RESOLUTIONS: 'Finished bulk loading',
	FAIL_RESOLUTION: 'Failed loading',
	FAIL_RESOLUTIONS: 'Failed bulk loading',
	INVALIDATE_RESOLUTION: 'Canceled loading',
};

const loadingMiddleware = () => ( next ) => ( action ) => {
	if ( actionTypeMap.hasOwnProperty( action.type ) ) {
		// eslint-disable-next-line no-console
		console.log(
			getCurrentTime() +
				': ' +
				actionTypeMap[ action.type ] +
				' ' +
				formatLoadedEntry( action )
		);
	}

	return next( action );
};

export default loadingMiddleware;
