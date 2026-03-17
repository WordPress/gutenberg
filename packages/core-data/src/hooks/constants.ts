export const Status = {
	Idle: 'IDLE',
	Resolving: 'RESOLVING',
	Error: 'ERROR',
	Success: 'SUCCESS',
} as const;

export type Status = ( typeof Status )[ keyof typeof Status ];
