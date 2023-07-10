export const enum Status {
	Idle = 'IDLE',
	Resolving = 'RESOLVING',
	Error = 'ERROR',
	Success = 'SUCCESS',
}

export const EMPTY_ARRAY = [];

export const META_SELECTORS = [
	'getIsResolving',
	'hasStartedResolution',
	'hasFinishedResolution',
	'isResolving',
	'getCachedResolvers',
];
