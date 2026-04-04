import { parseArgs } from 'node:util';
import { CDPTransport } from './transports/cdp.js';
import { RESTTransport } from './transports/rest.js';
import { startServer } from './server.js';
import type { Transport } from './transports/types.js';

function printUsage(): void {
	process.stderr.write( `Usage: wordpress-editor-mcp [options]

MCP server for the WordPress Site Editor.

Transport options (pick one):
  --cdp <url>        CDP WebSocket URL (e.g. ws://localhost:9222)
  --rest <url>       WordPress REST API base URL (e.g. http://localhost:8080)

REST authentication:
  --user <username>  WordPress username
  --password <pass>  Application password

Examples:
  wordpress-editor-mcp --cdp ws://localhost:9222
  wordpress-editor-mcp --rest http://localhost:8080 --user admin --password "xxxx xxxx xxxx xxxx"
\n` );
}

async function main(): Promise< void > {
	const { values } = parseArgs( {
		options: {
			cdp: { type: 'string' },
			rest: { type: 'string' },
			user: { type: 'string' },
			password: { type: 'string' },
			help: { type: 'boolean', short: 'h' },
		},
		strict: true,
	} );

	if ( values.help ) {
		printUsage();
		process.exit( 0 );
	}

	let transport: Transport;

	if ( values.cdp ) {
		transport = new CDPTransport( { target: values.cdp } );
	} else if ( values.rest ) {
		if ( ! values.user || ! values.password ) {
			process.stderr.write(
				'Error: --user and --password are required with --rest\n'
			);
			printUsage();
			process.exit( 1 );
		}
		transport = new RESTTransport( {
			baseUrl: values.rest,
			username: values.user,
			password: values.password,
		} );
	} else {
		process.stderr.write( 'Error: specify --cdp or --rest transport\n' );
		printUsage();
		process.exit( 1 );
	}

	await startServer( { transport } );
}

main().catch( ( error ) => {
	process.stderr.write( `Fatal: ${ error }\n` );
	process.exit( 1 );
} );
