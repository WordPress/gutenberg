/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { Spinner, __experimentalVStack as VStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import GuidelineAccordion from './components/guideline-accordion';
import GuidelineAccordionForm from './components/guideline-accordion-form';
import BlockGuidelines from './components/block-guidelines';
import GuidelineActionsSection from './components/guideline-actions-section';
import { useGuidelineData, scopeSlug, BLOCKS_SCOPE } from './data';

function GuidelinesPage() {
	const { scopes, contentBlocks, bySlug, query, isLoading } =
		useGuidelineData();

	// Only show the spinner on the first load. Later refetches (e.g. after a
	// save re-resolves the collection) must not unmount the sections, or the
	// accordions would collapse and lose any in-progress edits.
	const [ hasLoaded, setHasLoaded ] = useState( false );
	useEffect( () => {
		if ( ! isLoading ) {
			setHasLoaded( true );
		}
	}, [ isLoading ] );

	return (
		<Page
			title={ __( 'Guidelines' ) }
			subTitle={ __(
				"Set content standards that guide your team, inform plugins, and help AI tools generate content that matches your site's voice and requirements."
			) }
		>
			{ ! hasLoaded ? (
				<div className="guidelines__loading">
					<Spinner />
				</div>
			) : (
				<VStack className="guidelines__content">
					{ /*
					 * Disable reason: The `list` ARIA role is redundant but
					 * Safari+VoiceOver won't announce the list otherwise.
					 */
					/* eslint-disable jsx-a11y/no-redundant-roles */ }
					<ul role="list" className="guidelines__list">
						{ /*
						 * Scopes come sorted by order from the registry. The
						 * Blocks scope is rendered specially — its per-block rows
						 * instead of a single textarea. Removing it from the
						 * server registry drops the whole section here.
						 */ }
						{ scopes.map( ( scope ) => (
							<li
								key={ scope.slug }
								className="guidelines__list-item"
								data-slug={ scope.slug }
							>
								<GuidelineAccordion
									title={ scope.title }
									description={ scope.description }
								>
									{ scope.slug === BLOCKS_SCOPE ? (
										<BlockGuidelines
											contentBlocks={ contentBlocks }
											bySlug={ bySlug }
											query={ query }
										/>
									) : (
										<GuidelineAccordionForm
											scope={ scope }
											existingId={
												bySlug[
													scopeSlug( scope.slug )
												]?.id
											}
											content={
												bySlug[
													scopeSlug( scope.slug )
												]?.content ?? ''
											}
											query={ query }
										/>
									) }
								</GuidelineAccordion>
							</li>
						) ) }
					</ul>
					{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
					<GuidelineActionsSection
						scopes={ scopes }
						contentBlocks={ contentBlocks }
						bySlug={ bySlug }
						query={ query }
					/>
				</VStack>
			) }
		</Page>
	);
}

export const stage = GuidelinesPage;
