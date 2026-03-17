export const Status = {
	idle: 'idle',
	resolving: 'resolving',
	finished: 'finished',
	error: 'error',
} as const;

export type Status = ( typeof Status )[ keyof typeof Status ];
