/**
 * Copied pasted from `strip-ansi` to use without ESM.
 *
 * @see https://github.com/chalk/strip-ansi
 * Licensed under MIT license.
 *
 * @param string The ansi string.
 */
function stripAnsi( string: string ) {
	return string.replace(
		new RegExp(
			[
				'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
				'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
			].join( '|' ),
			'g'
		),
		''
	);
}

export { stripAnsi };
