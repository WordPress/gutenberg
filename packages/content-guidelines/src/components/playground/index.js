/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import {
	Button,
	SelectControl,
	TextareaControl,
	ToggleControl,
	Panel,
	PanelBody,
	Spinner,
	Notice,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../store';
import LintPanel from './lint-panel';
import ContextPreview from './context-preview';
import './style.scss';

/**
 * Task options.
 */
const TASK_OPTIONS = [
	{
		value: 'rewrite_intro',
		label: __( 'Rewrite intro paragraph', 'content-guidelines' ),
	},
	{
		value: 'generate_headlines',
		label: __( 'Generate 5 headline options', 'content-guidelines' ),
	},
	{
		value: 'write_cta',
		label: __( 'Write a CTA paragraph', 'content-guidelines' ),
	},
];

/**
 * Playground component.
 *
 * @param {Object} props               Component props.
 * @param {number} props.fixturePostId Selected fixture post ID.
 * @return {JSX.Element} Playground component.
 */
export default function Playground( { fixturePostId } ) {
	const [ task, setTask ] = useState( 'rewrite_intro' );
	const [ useDraft, setUseDraft ] = useState( true );
	const [ compare, setCompare ] = useState( false );
	const [ extraInstructions, setExtraInstructions ] = useState( '' );

	const { testResults, isRunningTest, hasDraft, error } = useSelect(
		( select ) => {
			return {
				testResults: select( STORE_NAME ).getTestResults(),
				isRunningTest: select( STORE_NAME ).isRunningTest(),
				hasDraft: select( STORE_NAME ).hasDraft(),
				error: select( STORE_NAME ).getError(),
			};
		},
		[]
	);

	const { runPlaygroundTest } = useDispatch( STORE_NAME );

	const handleRun = () => {
		if ( ! fixturePostId ) {
			return;
		}

		runPlaygroundTest( {
			task,
			fixture_post_id: fixturePostId,
			use: useDraft ? 'draft' : 'active',
			compare,
			extra_instructions: extraInstructions,
		} );
	};

	const canRun = fixturePostId && ! isRunningTest;

	return (
		<div className="content-guidelines-playground">
			<div className="content-guidelines-playground__controls">
				{ hasDraft && (
					<ToggleControl
						label={ __( 'Use draft guidelines', 'content-guidelines' ) }
						checked={ useDraft }
						onChange={ setUseDraft }
					/>
				) }

				{ hasDraft && (
					<ToggleControl
						label={ __( 'Compare draft vs active', 'content-guidelines' ) }
						checked={ compare }
						onChange={ setCompare }
						disabled={ ! useDraft }
					/>
				) }

				<SelectControl
					label={ __( 'Task', 'content-guidelines' ) }
					value={ task }
					options={ TASK_OPTIONS }
					onChange={ setTask }
				/>

				<TextareaControl
					label={ __( 'Extra instructions (optional)', 'content-guidelines' ) }
					value={ extraInstructions }
					onChange={ setExtraInstructions }
					rows={ 2 }
					placeholder={ __(
						'Any specific instructions for this test...',
						'content-guidelines'
					) }
				/>

				<Button
					variant="primary"
					onClick={ handleRun }
					disabled={ ! canRun }
					isBusy={ isRunningTest }
				>
					{ isRunningTest
						? __( 'Running...', 'content-guidelines' )
						: __( 'Run', 'content-guidelines' ) }
				</Button>

				{ ! fixturePostId && (
					<p className="content-guidelines-playground__note">
						{ __(
							'Select a post above to test against.',
							'content-guidelines'
						) }
					</p>
				) }
			</div>

			{ error && (
				<Notice status="error" isDismissible={ false }>
					{ error }
				</Notice>
			) }

			{ isRunningTest && (
				<div className="content-guidelines-playground__loading">
					<Spinner />
					<p>{ __( 'Running test...', 'content-guidelines' ) }</p>
				</div>
			) }

			{ testResults && ! isRunningTest && (
				<div className="content-guidelines-playground__results">
					{ /* Lint Results */ }
					<LintPanel results={ testResults.lint_results } />

					{ /* Compare Lint Results */ }
					{ testResults.compare?.lint_results && (
						<div className="content-guidelines-playground__compare">
							<h4>{ __( 'Active Guidelines Lint', 'content-guidelines' ) }</h4>
							<LintPanel results={ testResults.compare.lint_results } />
						</div>
					) }

					{ /* AI Result */ }
					{ testResults.ai_result && (
						<PanelBody
							title={ __( 'AI Result', 'content-guidelines' ) }
							initialOpen={ true }
						>
							<div className="content-guidelines-playground__ai-result">
								{ testResults.ai_result.output }
							</div>
							{ testResults.ai_result.alternatives && (
								<div className="content-guidelines-playground__alternatives">
									<h5>{ __( 'Alternatives', 'content-guidelines' ) }</h5>
									<ul>
										{ testResults.ai_result.alternatives.map(
											( alt, i ) => (
												<li key={ i }>{ alt }</li>
											)
										) }
									</ul>
								</div>
							) }
						</PanelBody>
					) }

					{ /* No AI Provider Message */ }
					{ testResults.ai_available === false && (
						<Notice status="info" isDismissible={ false }>
							{ testResults.ai_message ||
								__(
									'No AI provider connected. Showing lint checks and context preview.',
									'content-guidelines'
								) }
						</Notice>
					) }

					{ /* Context Preview */ }
					<ContextPreview packet={ testResults.context_packet } />

					{ /* Compare Context */ }
					{ testResults.compare?.context_packet && (
						<div className="content-guidelines-playground__compare">
							<h4>
								{ __(
									'Active Guidelines Context',
									'content-guidelines'
								) }
							</h4>
							<ContextPreview
								packet={ testResults.compare.context_packet }
							/>
						</div>
					) }
				</div>
			) }
		</div>
	);
}
