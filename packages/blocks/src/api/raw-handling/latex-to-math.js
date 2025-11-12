export default function isLatexMathMode( text ) {
	const lettersRegex = /[\p{L}\s]+/gu;
	let match;

	while ( ( match = lettersRegex.exec( text ) ) ) {
		// If it's immediately preceded by a left brace, it could be an
		// argument, so ignore this piece of text.
		if ( text[ match.index - 1 ] === '{' ) {
			continue;
		}

		let sequence = match[ 0 ];

		// If it's immediately preceded by a backslash, it could be a command,
		// so ignore any leading latin script letters.
		if ( text[ match.index - 1 ] === '\\' ) {
			sequence = sequence.replace( /^[a-zA-Z]+/, '' );
		}

		// If there's a sequence of 6 or more letters (with whitespace), it's a
		// strong indicator that it's not LaTeX math mode.
		// We can potentially increase this is there's false negatives.
		if ( sequence.length < 6 ) {
			continue;
		}

		return false;
	}

	// If there's a command with argument syntax, we can be pretty sure it's
	// LaTeX math mode.
	if ( /\\[a-zA-Z]+\s*\{/g.test( text ) ) {
		return true;
	}

	// Otherwise, check if there's at least two soft clues:
	// * An exponent (e.g., x^2)
	// * Common mathematical operators, but don't count each one separately
	//   since they're also found in normal text.
	// * A command (e.g., \alpha)
	const softClues = [
		( t ) => t.includes( '^' ) && ! t.startsWith( '^' ),
		( t ) =>
			[ '=', '+', '-', '/', '*' ].some( ( operator ) =>
				t.includes( operator )
			),
		( t ) => /\\[a-zA-Z]+/g.test( t ),
	];

	if ( softClues.filter( ( clue ) => clue( text ) ).length >= 2 ) {
		return true;
	}

	return false;
}
