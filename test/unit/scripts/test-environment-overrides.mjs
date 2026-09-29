import typescriptEslintParser from '@typescript-eslint/parser';

const TEST_ENVIRONMENT_OVERRIDE_PATTERN =
	/^\s*\*?\s*@(jest|vitest)-environment\b/m;

export function hasTestEnvironmentOverride( comments = [] ) {
	return comments.some( ( comment ) =>
		TEST_ENVIRONMENT_OVERRIDE_PATTERN.test( comment.value )
	);
}

export function sourceHasTestEnvironmentOverride( source, file ) {
	const { ast } = typescriptEslintParser.parseForESLint( source, {
		filePath: file,
		jsxFragmentName: null,
		jsxPragma: null,
		loc: true,
		range: true,
		comment: true,
		sourceType: 'module',
	} );

	return hasTestEnvironmentOverride( ast.comments );
}
