/**
 * WordPress dependencies
 */
import { sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import HeadingLevelIcon from './heading-level-icon';

const variations = [ 1, 2, 3, 4, 5, 6 ].map( ( level ) => ( {
	name: `heading-${ level }`,
	/* translators: %d: heading level. */
	title: sprintf( 'Heading %d', level ),
	icon: <HeadingLevelIcon level={ level } />,
	attributes: { level },
	scope: [ 'inserter' ],
} ) );

export default variations;
