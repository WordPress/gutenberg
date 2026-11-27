import path from 'node:path';
import { spawnWatchProcess } from '../../process.mjs';

// Starts a watcher, reports its pid and its descendant's pid, then idles
// until it is killed.
const watcher = spawnWatchProcess(
	process.execPath,
	[ path.join( import.meta.dirname, 'watch-process.mjs' ) ],
	{ stdio: [ 'ignore', 'pipe', 'inherit' ] }
);

watcher.stdout.once( 'data', ( data ) => {
	console.log( `${ watcher.pid } ${ data.toString().trim() }` );
} );

setInterval( () => {}, 1000 );
