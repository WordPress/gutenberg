/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { Notice } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import './style.scss';
import GuidelineAccordion from './components/guideline-accordion';
import GuidelineAccordionForm from './components/guideline-accordion-form';
import { fetchContentGuidelines } from './api';

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
		title: __( 'Additional' ),
		description: __( 'Add additional guidelines for your team.' ),

		slug: 'additional',
	},
];

function ContentGuidelinesPage() {
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
			title={ __( 'Content guidelines' ) }
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
								__( 'Error loading content guidelines: %s' ),
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
					<div className="content-guidelines__content">
						{ /*
						 * Disable reason: The `list` ARIA role is redundant but
						 * Safari+VoiceOver won't announce the list otherwise.
						 */
						/* eslint-disable jsx-a11y/no-redundant-roles */ }
						<ul role="list" className="content-guidelines__list">
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
												description={ item.description }
												contentId={ contentId }
												headingId={ headingId }
												descriptionId={ descriptionId }
											>
												<GuidelineAccordionForm
													slug={ item.slug }
													contentId={ contentId }
													headingId={ headingId }
													descriptionId={
														descriptionId
													}
												/>
											</GuidelineAccordion>
										</div>
									</li>
								);
							} ) }
						</ul>
						{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
					</div>
				)
			) }
		</Page>
	);
}

export const stage = ContentGuidelinesPage;
