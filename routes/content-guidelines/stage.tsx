/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import GuidelineAccordion from './components/guideline-accordion';
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
		title: __( 'Additional guidelines' ),
		description: __(
			'Include any additional standards such as SEO preferences, legal requirements, citation styles, or other content considerations.'
		),

		slug: 'additional',
	},
];

function ContentGuidelinesPage() {
	const [ loading, setLoading ] = useState( true );

	useEffect( () => {
		// Populate the store with the content guidelines.
		fetchContentGuidelines().then( () => setLoading( false ) );
	}, [] );

	return (
		<Page
			title={ __( 'Content guidelines' ) }
			subTitle={ __(
				"Set content standards that guide your team, inform plugins, and help AI tools generate content that matches your site's voice and requirements."
			) }
		>
			{ loading ? (
				<div className="content-guidelines__loading">
					<Spinner />
				</div>
			) : (
				<div className="content-guidelines__content">
					{ /*
					 * Disable reason: The `list` ARIA role is redundant but
					 * Safari+VoiceOver won't announce the list otherwise.
					 */
					/* eslint-disable jsx-a11y/no-redundant-roles */ }
					<ul role="list" className="content-guidelines__list">
						{ GUIDELINE_ITEMS.map( ( item ) => (
							<li
								key={ item.slug }
								className="content-guidelines__list-item"
							>
								<div className="content-guidelines__accordion-item">
									<GuidelineAccordion
										title={ item.title }
										description={ item.description }
										slug={ item.slug }
									/>
								</div>
							</li>
						) ) }
					</ul>
					{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
				</div>
			) }
		</Page>
	);
}

export const stage = ContentGuidelinesPage;
