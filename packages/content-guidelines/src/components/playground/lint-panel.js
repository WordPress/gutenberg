/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { warning, info } from '@wordpress/icons';

/**
 * Lint panel component.
 *
 * @param {Object} props         Component props.
 * @param {Object} props.results Lint check results.
 * @return {JSX.Element} Lint panel.
 */
export default function LintPanel( { results } ) {
	if ( ! results ) {
		return null;
	}

	const { issues = [], suggestions = [], stats = {} } = results;
	const hasIssues = issues.length > 0;
	const hasSuggestions = suggestions.length > 0;

	const title = hasIssues
		? __( 'Lint Checks', 'content-guidelines' ) +
		  ` (${ issues.length } ${ issues.length === 1 ? 'issue' : 'issues' })`
		: __( 'Lint Checks', 'content-guidelines' );

	return (
		<PanelBody title={ title } initialOpen={ hasIssues }>
			{ ! hasIssues && ! hasSuggestions && (
				<p className="content-guidelines-lint__success">
					{ __( 'No issues found.', 'content-guidelines' ) }
				</p>
			) }

			{ hasIssues && (
				<div className="content-guidelines-lint__issues">
					<h4 className="content-guidelines-lint__section-title">
						{ __( 'Issues', 'content-guidelines' ) }
					</h4>
					<ul className="content-guidelines-lint__list">
						{ issues.map( ( issue, index ) => (
							<li
								key={ index }
								className="content-guidelines-lint__item content-guidelines-lint__item--issue"
							>
								<span className="content-guidelines-lint__icon">
									⚠️
								</span>
								<div className="content-guidelines-lint__content">
									<span className="content-guidelines-lint__message">
										{ issue.message }
									</span>
									{ issue.note && (
										<span className="content-guidelines-lint__note">
											{ issue.note }
										</span>
									) }
								</div>
							</li>
						) ) }
					</ul>
				</div>
			) }

			{ hasSuggestions && (
				<div className="content-guidelines-lint__suggestions">
					<h4 className="content-guidelines-lint__section-title">
						{ __( 'Suggestions', 'content-guidelines' ) }
					</h4>
					<ul className="content-guidelines-lint__list">
						{ suggestions.map( ( suggestion, index ) => (
							<li
								key={ index }
								className="content-guidelines-lint__item content-guidelines-lint__item--suggestion"
							>
								<span className="content-guidelines-lint__icon">
									💡
								</span>
								<div className="content-guidelines-lint__content">
									<span className="content-guidelines-lint__message">
										{ suggestion.message }
									</span>
									{ suggestion.note && (
										<span className="content-guidelines-lint__note">
											{ suggestion.note }
										</span>
									) }
								</div>
							</li>
						) ) }
					</ul>
				</div>
			) }

			{ stats && Object.keys( stats ).length > 0 && (
				<div className="content-guidelines-lint__stats">
					<h4 className="content-guidelines-lint__section-title">
						{ __( 'Stats', 'content-guidelines' ) }
					</h4>
					<dl className="content-guidelines-lint__stats-list">
						{ stats.word_count !== undefined && (
							<>
								<dt>{ __( 'Words', 'content-guidelines' ) }</dt>
								<dd>{ stats.word_count }</dd>
							</>
						) }
						{ stats.sentence_count !== undefined && (
							<>
								<dt>{ __( 'Sentences', 'content-guidelines' ) }</dt>
								<dd>{ stats.sentence_count }</dd>
							</>
						) }
						{ stats.avg_words_per_sentence !== undefined && (
							<>
								<dt>
									{ __( 'Avg. words/sentence', 'content-guidelines' ) }
								</dt>
								<dd>{ stats.avg_words_per_sentence }</dd>
							</>
						) }
					</dl>
				</div>
			) }
		</PanelBody>
	);
}
