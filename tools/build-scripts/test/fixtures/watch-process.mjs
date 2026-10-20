import { spawn } from 'node:child_process';

const descendant = spawn(
	process.execPath,
	[ '-e', 'setInterval( () => {}, 1000 )' ],
	{ stdio: 'inherit' }
);

console.log( descendant.pid );
setInterval( () => {}, 1000 );
