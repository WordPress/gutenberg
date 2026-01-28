/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityRecords } from '@wordpress/core-data';
import { useEffect, useMemo, useState } from '@wordpress/element';
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
	const [ selectedPostId, setSelectedPostId ] = useState(
		fixturePostId ? String( fixturePostId ) : ''
	);

	const { testResults, isRunningTest, error } = useSelect( ( select ) => {
		return {
			testResults: select( STORE_NAME ).getTestResults(),
			isRunningTest: select( STORE_NAME ).isRunningTest(),
			error: select( STORE_NAME ).getError(),
		};
	}, [] );

	const postsQuery =
		useEntityRecords( 'postType', 'post', {
			per_page: 20,
			context: 'edit',
			_fields: [ 'id', 'title' ],
		} ) || {};
	const pagesQuery =
		useEntityRecords( 'postType', 'page', {
			per_page: 20,
			context: 'edit',
			_fields: [ 'id', 'title' ],
		} ) || {};

	const posts = postsQuery.records;
	const pages = pagesQuery.records;
	const isLoadingPosts = !! postsQuery.isResolving;
	const isLoadingPages = !! pagesQuery.isResolving;
	const isLoadingOptions = isLoadingPosts || isLoadingPages;

	const postOptions = useMemo( () => {
		const items = [ ...( posts || [] ), ...( pages || [] ) ];

		if ( ! items.length ) {
			return [];
		}

		return items.map( ( item ) => ( {
			label: item.title?.rendered || __( '(No title)' ),
			value: String( item.id ),
		} ) );
	}, [ pages, posts ] );

	const selectedOption = useMemo( () => {
		if ( ! selectedPostId ) {
			return [];
		}

		const hasSelected = postOptions.some(
			( option ) => option.value === selectedPostId
		);
		if ( hasSelected ) {
			return [];
		}

		const parsedId = parseInt( selectedPostId, 10 );
		const label = Number.isNaN( parsedId )
			? __( 'Selected post' )
			: sprintf(
					/* translators: %d: post ID. */
					__( 'Selected post (ID %d)' ),
					parsedId
			  );

		return [
			{
				label,
				value: selectedPostId,
			},
		];
	}, [ postOptions, selectedPostId ] );

	const postOptionsWithSelected = useMemo(
		() =>
			selectedOption.length
				? [ ...selectedOption, ...postOptions ]
				: postOptions,
		[ postOptions, selectedOption ]
	);

	useEffect( () => {
		if ( ! selectedPostId && postOptions.length ) {
			setSelectedPostId( postOptions[ 0 ].value );
		} else if (
			selectedPostId &&
			postOptions.length === 0 &&
			! isLoadingOptions
		) {
			setSelectedPostId( '' );
		}
	}, [ isLoadingOptions, postOptions, selectedPostId ] );

	const { runPlaygroundTest } = useDispatch( STORE_NAME );

	const handleRun = () => {
		const targetPostId = selectedPostId
			? parseInt( selectedPostId, 10 )
			: null;

		if ( ! targetPostId ) {
			return;
		}

		runPlaygroundTest( {
			task,
			fixture_post_id: targetPostId,
			extra_instructions: extraInstructions,
		} );
	};

	const canRun =
		!! selectedPostId &&
		! isRunningTest &&
		! isLoadingPosts &&
		! isLoadingPages;

	return (
		<div className="content-guidelines-playground">
			<div className="content-guidelines-playground__controls">
				<SelectControl
					label={ __( 'Task' ) }
					value={ task }
					options={ TASK_OPTIONS }
					onChange={ setTask }
					__next40pxDefaultSize
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

				<SelectControl
					label={ __( 'Fixture post' ) }
					value={ selectedPostId }
					options={ postOptionsWithSelected }
					onChange={ setSelectedPostId }
					disabled={ isLoadingPosts || isLoadingPages }
					help={ __( 'Choose content to run checks against.' ) }
					__next40pxDefaultSize
				/>

				<Button
					variant="primary"
					onClick={ handleRun }
					disabled={ ! canRun }
					isBusy={ isRunningTest }
					__next40pxDefaultSize
					accessibleWhenDisabled
				>
					{ isRunningTest ? __( 'Running…' ) : __( 'Run' ) }
				</Button>

				{ ! selectedPostId && (
					<p className="content-guidelines-playground__note">
						{ __( 'Choose a post above to run checks.' ) }
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
					{ /* No AI Provider Message - shown at top */ }
					{ testResults.ai_available === false && (
						<Notice status="info" isDismissible={ false }>
							{ testResults.ai_message ||
								__(
									'No AI provider connected. Showing lint checks and context preview.'
								) }
						</Notice>
					) }

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

					{ /* Context Preview */ }
					<ContextPreview packet={ testResults.context_packet } />
				</div>
			) }
		</div>
	);
}
