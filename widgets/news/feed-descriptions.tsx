/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';

type FeedDescriptionSource = {
	siteUrl: string;
	label: string;
};

export function createWordPressNewsFeedDescription(
	feed: FeedDescriptionSource
) {
	return createInterpolateElement(
		__(
			'Shows articles from the official WordPress.org news blog at <link />'
		),
		{
			link: (
				<Link href={ feed.siteUrl } openInNewTab>
					{ feed.label }
				</Link>
			),
		}
	);
}

export function createPlanetWordPressFeedDescription(
	feed: FeedDescriptionSource
) {
	return createInterpolateElement(
		__(
			'Shows posts from the WordPress Planet community feed at <link />'
		),
		{
			link: (
				<Link href={ feed.siteUrl } openInNewTab>
					{ feed.label }
				</Link>
			),
		}
	);
}
