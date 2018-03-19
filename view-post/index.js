/**
 * External dependencies
 */
import moment from 'moment-timezone';
import 'moment-timezone/moment-timezone-utils';

/**
 * WordPress dependencies
 */
import { Button, ifCondition, Tooltip } from '@wordpress/components';
import { compose, render } from '@wordpress/element';
import { settings as dateSettings } from '@wordpress/date';

// Configure moment globally
moment.locale( dateSettings.l10n.locale );
if ( dateSettings.timezone.string ) {
	moment.tz.setDefault( dateSettings.timezone.string );
} else {
	const momentTimezone = {
		name: 'WP',
		abbrs: [ 'WP' ],
		untils: [ null ],
		offsets: [ -dateSettings.timezone.offset * 60 ],
	};
	const unpackedTimezone = moment.tz.pack( momentTimezone );
	moment.tz.add( unpackedTimezone );
	moment.tz.setDefault( 'WP' );
}

const Categories = compose(
	// TODO: withAPIData depends on editor because of the context used?!!!!
	/*withAPIData( () => {
		return {
			categories: '/wp/v2/categories',
		};
	} ),*/
	ifCondition( ( categories ) => categories && categories.length )
)( ( { categories } ) => (
	<div>
		<h3>Categories from API</h3>
		{ categories.map(
			( category ) => <p key={ category.id }>{ category.name }</p>
		) }
	</div>
) );

const ViewPost = ( ) => (
	<div>
		<Tooltip text="More information">
			<Button>
				Hover for more information
			</Button>
		</Tooltip>
		<Categories />
	</div>
);

/**
 * Renders post's view.
 *
 * The return value of this function is not necessary if we change where we
 * call initializeEditor(). This is due to metaBox timing.
 */
export function init() {
	const target = document.querySelector( '.entry-content' );

	render(
		<ViewPost />,
		target
	);
}
