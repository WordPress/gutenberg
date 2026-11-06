import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { ask, buildRequest } from './decision-api.ts';
import { buildEvidence } from './evidence.ts';
import { findGeneratedFiles } from './generated-files.ts';
import { getPullRequest } from './github.ts';
import { decide, renderReport } from './report.ts';
import { loadRoutingRules } from './routing-rules.ts';

const USAGE = `Usage: npm run --workspace @wordpress/review-routing-tools route -- --pr <number> [options]

Options:
  --pr <number>     Pull request to evaluate.
  --repo <name>     Repository as owner/name. Default: WordPress/gutenberg.
  --dry-run         Print the evidence and questions. Does not call the model.
  --json            Print the decisions as JSON, not Markdown.
  --help            Show this message.

Credentials come from the environment, or from tools/review-routing/.env.
See tools/review-routing/README.md.`;

/*
 * Values that are already in the environment win, so CI, or a tool that sets
 * variables for one command, can supply them without a file.
 */
const ENV_FILE = new URL( '../.env', import.meta.url );
if ( existsSync( ENV_FILE ) ) {
	process.loadEnvFile( ENV_FILE );
}

const { values } = parseArgs( {
	options: {
		pr: { type: 'string' },
		repo: { type: 'string', default: 'WordPress/gutenberg' },
		'dry-run': { type: 'boolean', default: false },
		json: { type: 'boolean', default: false },
		help: { type: 'boolean', default: false },
	},
} );

const number = Number( values.pr );
if ( values.help || ! Number.isInteger( number ) || number <= 0 ) {
	process.stdout.write( `${ USAGE }\n` );
	process.exit( values.help ? 0 : 1 );
}

const { DECISION_API_URL, DECISION_API_KEY, DECISION_MODEL } = process.env;

/**
 * Reads a GitHub token from the environment, or else from the GitHub CLI when
 * it is installed and signed in. Without either, requests go unauthenticated.
 *
 * @return The token, if there is one.
 */
function getGitHubToken(): string | undefined {
	if ( process.env.GITHUB_TOKEN ) {
		return process.env.GITHUB_TOKEN;
	}

	try {
		return (
			execFileSync( 'gh', [ 'auth', 'token' ], {
				encoding: 'utf8',
				stdio: [ 'ignore', 'pipe', 'ignore' ],
			} ).trim() || undefined
		);
	} catch {
		return undefined;
	}
}

const rules = await loadRoutingRules();
const pull = await getPullRequest( values.repo, number, getGitHubToken() );
const generated = findGeneratedFiles(
	pull.files.map( ( file ) => file.filename )
);
const { state, stats } = buildEvidence( pull, generated );
const request = buildRequest( state, rules, DECISION_MODEL ?? '' );

if ( values[ 'dry-run' ] ) {
	const questions = rules.map(
		( rule ) => `### ${ rule.id }\n\n${ rule.instructions }`
	);
	process.stdout.write(
		`${ state }\n\n---\n\n# Questions\n\n${ questions.join( '\n\n' ) }\n`
	);
	process.exit( 0 );
}

if ( ! DECISION_API_URL || ! DECISION_API_KEY || ! DECISION_MODEL ) {
	process.stderr.write(
		'Set DECISION_API_URL, DECISION_API_KEY and DECISION_MODEL, or use --dry-run. See tools/review-routing/README.md.\n'
	);
	process.exit( 1 );
}

const probabilities = await ask( request, {
	url: DECISION_API_URL,
	apiKey: DECISION_API_KEY,
} );
const decisions = decide( rules, probabilities );

process.stdout.write(
	values.json
		? `${ JSON.stringify(
				decisions.map( ( { rule, probability, requestReview } ) => ( {
					rule: rule.id,
					team: rule.team,
					probability,
					threshold: rule.threshold,
					requestReview,
				} ) ),
				null,
				'\t'
			) }\n`
		: `${ renderReport( decisions, stats, DECISION_MODEL ) }\n`
);
