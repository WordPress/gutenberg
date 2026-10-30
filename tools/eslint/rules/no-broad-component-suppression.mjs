import { ConfigCommentParser } from '@eslint/plugin-kit';

const RECOMMENDATION_RULE = '@wordpress/use-recommended-components';
const commentParser = new ConfigCommentParser();

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
				'Place eslint-disable-next-line {{ rule }} immediately above one import specifier or destructured property on its own line.',
		},
	},
	create( context ) {
		const { sourceCode } = context;

		return {
			'Program:exit'() {
				for ( const comment of sourceCode.getAllComments() ) {
					const directive = commentParser.parseDirective(
						comment.value
					);
					if (
						! directive ||
						! /^eslint-disable(?:-next-line|-line)?$/u.test(
							directive.label
						) ||
						! commentParser.parseListConfig( directive.value )[
							RECOMMENDATION_RULE
						]
					) {
						continue;
					}

					const targetLine = comment.loc.end.line + 1;
					const token = sourceCode.getTokenAfter( comment );
					const node =
						token &&
						sourceCode.getNodeByRangeIndex( token.range[ 0 ] );
					const component =
						node?.type === 'ImportSpecifier' ||
						node?.type === 'Property'
							? node
							: node?.parent;
					if (
						directive.label === 'eslint-disable-next-line' &&
						( component?.type === 'ImportSpecifier' ||
							( component?.type === 'Property' &&
								component.parent.type === 'ObjectPattern' ) ) &&
						component.loc.start.line === targetLine &&
						component.loc.end.line === targetLine
					) {
						const before = sourceCode.getTokenBefore( component );
						let after = sourceCode.getTokenAfter( component );
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
