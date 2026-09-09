const ANSI = /\u001B\[[0-9;]*m/g;
const CYAN = '\u001B[96m';
const RESET = '\u001B[0m';

/*
 * Bookkeeping `--verbose` adds: a timestamped status line, bracketed by
 * `--pretty` or plain, and the project entries listed under the first one.
 */
const STATUS =
	/^(?:\[\d{1,2}:\d{2}:\d{2}(?: [AP]M)?\] |\d{1,2}:\d{2}:\d{2}(?: [AP]M)? - )/;
const LISTED_PROJECT = /^\s+\* .+\.json$/;
const BUILDING = /Building project '(.+)'/;

/*
 * A diagnostic tsc placed on no file, which is what a `types` entry inherited
 * through `extends` produces. Without the project there is nothing to grep.
 */
const UNPLACED = /^error TS\d+: /;

/**
 * Builds the transform applied to each line of `tsc --build --pretty
 * --verbose`. It is stateful: it remembers the project tsc last announced.
 *
 * @param {boolean} verbatim Keep the bookkeeping, because `--verbose` was asked for.
 * @return {(line: string) => string|null} The line to print, or `null` to drop it.
 */
export function createLineTransform( verbatim = false ) {
	let project = '';
	let dropped = false;

	return ( line ) => {
		const text = line.replace( ANSI, '' );

		if ( STATUS.test( text ) ) {
			project = BUILDING.exec( text )?.[ 1 ] ?? project;
		}

		if ( ! verbatim ) {
			// Every dropped entry is followed by a blank line of its own.
			if ( STATUS.test( text ) || LISTED_PROJECT.test( text ) ) {
				dropped = true;
				return null;
			}
			if ( dropped && ! text.trim() ) {
				dropped = false;
				return null;
			}
			dropped = false;
		}

		if ( ! UNPLACED.test( text ) || ! project ) {
			return line;
		}

		// Colored only where tsc colors the rest, so `--pretty false` stays plain.
		const name =
			text === line ? project : `${ CYAN }${ project }${ RESET }`;
		return `${ name } - ${ line }`;
	};
}
