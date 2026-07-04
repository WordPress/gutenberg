/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { Spinner, __experimentalVStack as VStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import GuidelineAccordion from './components/guideline-accordion';
import GuidelineAccordionForm from './components/guideline-accordion-form';
import BlockGuidelines from './components/block-guidelines';
import GuidelineActionsSection from './components/guideline-actions-section';
import { useGuidelineData, scopeSlug } from './data';

// The Blocks section is not a registry scope; it renders the per-block rows.
// Placed between Images (30) and Additional (50) to keep the historical order.
const BLOCKS_ORDER = 40;

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

	const sections = useMemo( () => {
		const scopeSections = scopes.map( ( scope ) => ( {
			key: scope.slug,
			order: scope.order,
			scope,
		} ) );

		const blocksSection = {
			key: 'blocks',
			order: BLOCKS_ORDER,
			scope: null,
		};

		return [ ...scopeSections, blocksSection ].sort(
			( a, b ) => a.order - b.order
		);
	}, [ scopes ] );

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
						{ sections.map( ( section ) =>
							section.scope ? (
								<li
									key={ section.key }
									className="guidelines__list-item"
									data-slug={ section.key }
								>
									<GuidelineAccordion
										title={ section.scope.title }
										description={
											section.scope.description
										}
									>
										<GuidelineAccordionForm
											scope={ section.scope }
											existingId={
												bySlug[
													scopeSlug(
														section.scope.slug
													)
												]?.id
											}
											content={
												bySlug[
													scopeSlug(
														section.scope.slug
													)
												]?.content ?? ''
											}
											query={ query }
										/>
									</GuidelineAccordion>
								</li>
							) : (
								<li
									key={ section.key }
									className="guidelines__list-item"
									data-slug="blocks"
								>
									<GuidelineAccordion
										title={ __( 'Blocks' ) }
										description={ __(
											'Create tailored guidelines for specific block types.'
										) }
									>
										<BlockGuidelines
											contentBlocks={ contentBlocks }
											bySlug={ bySlug }
											query={ query }
										/>
									</GuidelineAccordion>
								</li>
							)
						) }
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
