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
		label: __( 'Rewrite intro paragraph' ),
	},
	{
		value: 'generate_headlines',
		label: __( 'Generate 5 headline options' ),
	},
	{
		value: 'write_cta',
		label: __( 'Write a CTA paragraph' ),
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
	const [ extraInstructions, setExtraInstructions ] = useState( '' );

	const { testResults, isRunningTest, error } = useSelect( ( select ) => {
		return {
			testResults: select( STORE_NAME ).getTestResults(),
			isRunningTest: select( STORE_NAME ).isRunningTest(),
			error: select( STORE_NAME ).getError(),
		};
	}, [] );

	const { runPlaygroundTest } = useDispatch( STORE_NAME );

	const handleRun = () => {
		if ( ! fixturePostId ) {
			return;
		}

		runPlaygroundTest( {
			task,
			fixture_post_id: fixturePostId,
			extra_instructions: extraInstructions,
		} );
	};

	const canRun = fixturePostId && ! isRunningTest;

	return (
		<div className="content-guidelines-playground">
			<div className="content-guidelines-playground__controls">
				<SelectControl
					label={ __( 'Task' ) }
					value={ task }
					options={ TASK_OPTIONS }
					onChange={ setTask }
				/>

				<TextareaControl
					label={ __( 'Extra instructions (optional)' ) }
					value={ extraInstructions }
					onChange={ setExtraInstructions }
					rows={ 2 }
					placeholder={ __(
						'Any specific instructions for this test…'
					) }
				/>

				<Button
					variant="primary"
					onClick={ handleRun }
					disabled={ ! canRun }
					isBusy={ isRunningTest }
				>
					{ isRunningTest ? __( 'Running…' ) : __( 'Run' ) }
				</Button>

				{ ! fixturePostId && (
					<p className="content-guidelines-playground__note">
						{ __( 'Select a post above to test against.' ) }
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
					<p>{ __( 'Running test…' ) }</p>
				</div>
			) }

			{ testResults && ! isRunningTest && (
				<div className="content-guidelines-playground__results">
					{ /* Lint Results */ }
					<LintPanel results={ testResults.lint_results } />

					{ /* AI Result */ }
					{ testResults.ai_result && (
						<PanelBody title={ __( 'AI Result' ) } initialOpen>
							<div className="content-guidelines-playground__ai-result">
								{ testResults.ai_result.output }
							</div>
							{ testResults.ai_result.alternatives && (
								<div className="content-guidelines-playground__alternatives">
									<h5>{ __( 'Alternatives' ) }</h5>
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
									'No AI provider connected. Showing lint checks and context preview.'
								) }
						</Notice>
					) }

					{ /* Context Preview */ }
					<ContextPreview packet={ testResults.context_packet } />
				</div>
			) }
		</div>
	);
}
