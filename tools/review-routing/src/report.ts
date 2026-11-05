import type { EvidenceStats } from './evidence.ts';
import type { RoutingRule } from './routing-rules.ts';

export type Decision = {
	rule: RoutingRule;
	probability: number;
	requestReview: boolean;
};

/**
 * Decides, for each rule, whether its probability reaches its threshold.
 *
 * @param rules         Routing rules.
 * @param probabilities Probabilities, keyed by rule id.
 * @return One decision for each rule.
 */
export function decide(
	rules: RoutingRule[],
	probabilities: Record< string, number >
): Decision[] {
	return rules.map( ( rule ) => ( {
		rule,
		probability: probabilities[ rule.id ],
		requestReview: probabilities[ rule.id ] >= rule.threshold,
	} ) );
}

/**
 * Renders the decisions as Markdown, for a terminal or a PR comment.
 *
 * @param decisions Decisions.
 * @param stats     What the evidence left out.
 * @param model     Model that answered.
 * @return Markdown.
 */
export function renderReport(
	decisions: Decision[],
	stats: EvidenceStats,
	model: string
): string {
	const rows = decisions.map(
		( { rule, probability, requestReview } ) =>
			// Team names are in code format, so that a new comment does not
			// notify the team. The review request is what notifies.
			`| ${ rule.id } | \`${ rule.team }\` | ${ probability.toFixed(
				2
			) } | ${ rule.threshold.toFixed( 2 ) } | ${
				requestReview ? 'Request review' : 'No request'
			} |`
	);

	const tokens = Math.round( stats.characters / 4 ).toLocaleString( 'en' );

	return [
		'| Rule | Team | Probability | Threshold | Decision |',
		'| --- | --- | --- | --- | --- |',
		...rows,
		'',
		`Model \`${ model }\` read ${ stats.files } files, about ${ tokens } tokens. Diffs: ${ stats.generated } generated, ${ stats.trimmed } trimmed, ${ stats.omitted } left out for budget.`,
	].join( '\n' );
}
