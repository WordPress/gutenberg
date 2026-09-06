import { fileURLToPath } from 'node:url';

export const managerEntries = [
	fileURLToPath( import.meta.resolve( './manager.ts' ) ),
];
