
/**
 * WordPress dependencies
 */
import { Page } from './shims/page';
import { __, sprintf } from '@wordpress/i18n';
import {
	createElement,
	useEffect,
	useState,
	useSyncExternalStore,
} from '@wordpress/element';
import {
	Spinner,
	Navigator,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { Notice } from './shims/notice';

/**
 * Internal dependencies
 */
import './style.scss';
import GuidelineAccordion from './components/guideline-accordion';
import GuidelineAccordionForm from './components/guideline-accordion-form';
import { fetchContentGuidelines } from './api';
import BlockGuidelines from './components/block-guidelines';
import ActionsSection from './components/actions-section';
import RevisionHistory from './components/revision-history';
import { EXPLORATION_STORAGE_KEY } from './explorations';
import ExplorationB from './components/exploration-b';
import ExplorationC from './components/exploration-c';

const GUIDELINE_ITEMS = [
	{
		title: __( 'Site' ),
		description: __(
			"Describe your site's purpose, goals, and primary audience."
		),

		slug: 'site',
	},
	{
		title: __( 'Copy' ),
		description: __(
			'Set your writing standards for tone, voice, style, and formatting.'
		),

		slug: 'copy',
	},
	{
		title: __( 'Images' ),
		description: __(
			'Outline your style, dimensions, formats, mood and aesthetic preferences.'
		),

		slug: 'images',
	},
	{
		title: __( 'Blocks' ),
		description: __(
			'Create tailored guidelines for specific block types.'
		),
		slug: 'blocks',
	},
	{
		title: __( 'Additional' ),
		description: __( 'Add additional guidelines for your team.' ),

		slug: 'additional',
	},
];

/**
 * Hook to read the current exploration from localStorage.
 * Uses useSyncExternalStore so changes from the admin bar
 * dropdown are picked up instantly (no page reload).
 */
function useExploration(): string {
	return useSyncExternalStore(
		( callback ) => {
			const handler = () => callback();
			window.addEventListener( 'exploration-changed', handler );
			window.addEventListener( 'storage', handler );
			return () => {
				window.removeEventListener( 'exploration-changed', handler );
				window.removeEventListener( 'storage', handler );
			};
		},
		() =>
			window.localStorage.getItem( EXPLORATION_STORAGE_KEY ) || 'A'
	);
}

function BaselineContentGuidelinesPage() {
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );

	useEffect( () => {
		// Populate the store with the content guidelines.
		fetchContentGuidelines()
			.then( () => setError( null ) )
			.catch( ( e: Error ) => setError( e.message ) )
			.finally( () => setLoading( false ) );
	}, [] );

	return (
		<Page
			title={ __( 'Guidelines' ) }
			subTitle={ __(
				"Set content standards that guide your team, inform plugins, and help AI tools generate content that matches your site's voice and requirements."
			) }
		>
			{ error && (
				<div className="content-guidelines__content">
					<Notice.Root intent="error">
						<Notice.Title>
							{ sprintf(
								/* translators: %s: Error message. */
								__( 'Error loading guidelines: %s' ),
								error
							) }
						</Notice.Title>
						<Notice.Description>
							{ __(
								'Please try again. If the problem persists, contact support.'
							) }
						</Notice.Description>
					</Notice.Root>
				</div>
			) }
			{ loading ? (
				<div className="content-guidelines__loading">
					<Spinner />
				</div>
			) : (
				! error && (
					<Navigator initialPath="/">
						<Navigator.Screen path="/">
							<VStack className="content-guidelines__content">
								{ /*
								 * Disable reason: The `list` ARIA role is redundant but
								 * Safari+VoiceOver won't announce the list otherwise.
								 */
								/* eslint-disable jsx-a11y/no-redundant-roles */ }
								<ul
									role="list"
									className="content-guidelines__list"
								>
									{ GUIDELINE_ITEMS.map( ( item ) => {
										const contentId = `content-guidelines-${ item.slug }`;
										const headingId = `content-guidelines-${ item.slug }-heading`;
										const descriptionId = `content-guidelines-${ item.slug }-description`;

										return (
											<li
												key={ item.slug }
												className="content-guidelines__list-item"
											>
												<div className="content-guidelines__accordion-item">
													<GuidelineAccordion
														title={ item.title }
														description={
															item.description
														}
														contentId={ contentId }
														headingId={ headingId }
														descriptionId={
															descriptionId
														}
													>
														{ item.slug ===
														'blocks' ? (
															<BlockGuidelines />
														) : (
															<GuidelineAccordionForm
																slug={
																	item.slug
																}
																contentId={
																	contentId
																}
																headingId={
																	headingId
																}
																descriptionId={
																	descriptionId
																}
															/>
														) }
													</GuidelineAccordion>
												</div>
											</li>
										);
									} ) }
								</ul>
								{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
								<ActionsSection />
							</VStack>
						</Navigator.Screen>
						<Navigator.Screen path="/revision-history">
							<RevisionHistory />
						</Navigator.Screen>
					</Navigator>
				)
			) }
		</Page>
	);
}

function ContentGuidelinesPage() {
	const exploration = useExploration();

	switch ( exploration ) {
		case 'B':
			return <ExplorationB />;
		case 'C':
			return <ExplorationC />;
		default:
			return <BaselineContentGuidelinesPage />;
	}
}

export const stage = ContentGuidelinesPage;
