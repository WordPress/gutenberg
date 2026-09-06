import { pathToFileURL } from 'node:url';

const minimum = [ 22, 22, 0 ];

export function supportsNode( version ) {
	const current = version.split( '.' ).map( Number );

	for ( let index = 0; index < minimum.length; index++ ) {
		if ( current[ index ] > minimum[ index ] ) {
			return true;
		}
		if ( current[ index ] < minimum[ index ] ) {
			return false;
		}
	}

	return true;
}

function checkNode() {
	if ( supportsNode( process.versions.node ) ) {
		return;
	}

	process.stderr.write(
		`AI development tests require Node.js 22.22.0 or newer. Current version: ${ process.versions.node }. Run \`nvm use "$(cat test/ai-development/.nvmrc)"\` from the repository root.\n`
	);
	process.exitCode = 1;
}

if (
	process.argv[ 1 ] &&
	import.meta.url === pathToFileURL( process.argv[ 1 ] ).href
) {
	checkNode();
}
