const RECOMMENDATION_RULE = '@wordpress/use-recommended-components';

/** @type {import('eslint').Rule.RuleModule} */
export default {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Require component recommendation exceptions to cover one component.',
		},
		schema: [],
		messages: {
			narrowSuppression:
				'Place eslint-disable-next-line {{ rule }} immediately above one import specifier on its own line.',
		},
	},
	create( context ) {
		const { sourceCode } = context;
		/** @type {import('estree').ImportSpecifier[]} */
		const specifiers = [];

		return {
			ImportSpecifier( node ) {
				specifiers.push( node );
			},
			'Program:exit'() {
				for ( const comment of sourceCode.getAllComments() ) {
					const directive = comment.value.match(
						/^\s*(eslint-disable(?:-next-line|-line)?)(?:\s|$)([\s\S]*)/
					);
					const rules = directive?.[ 2 ]
						.split( /\s-{2,}\s/u )[ 0 ]
						.trim()
						.split( /[\s,]+/u );
					if ( ! rules?.includes( RECOMMENDATION_RULE ) ) {
						continue;
					}

					const targetLine = comment.loc.end.line + 1;
					const specifier = specifiers.find(
						( node ) =>
							node.loc.start.line === targetLine &&
							node.loc.end.line === targetLine
					);
					if (
						directive[ 1 ] === 'eslint-disable-next-line' &&
						specifier
					) {
						const before = sourceCode.getTokenBefore( specifier );
						let after = sourceCode.getTokenAfter( specifier );
						if ( after?.value === ',' ) {
							after = sourceCode.getTokenAfter( after );
						}
						if (
							before.loc.end.line < targetLine &&
							after.loc.start.line > targetLine
						) {
							continue;
						}
					}

					context.report( {
						loc: comment.loc,
						messageId: 'narrowSuppression',
						data: { rule: RECOMMENDATION_RULE },
					} );
				}
			},
		};
	},
};
