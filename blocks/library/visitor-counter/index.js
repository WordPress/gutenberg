/**
 * External dependencies
 */
import { padStart } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

export const name = 'core/visitor-counter';

export const settings = {
	title: __( 'Counter' ),

	description: __( 'Display the number of visitors to your site.' ),

	icon: 'location',

	category: 'common',

	attributes: {
		count: {
			type: 'number',
			source: 'meta',
			meta: 'visitor-count',
			default: 0,
		},
	},

	edit( { attributes, className } ) {
		const { count } = attributes;

		return (
			<div className={ `${ className }` } key="block">
				<div className="visitor-counter-border visitor-counter-top-border"></div>
				<div className="visitor-counter-border visitor-counter-right-border"></div>
				<div className="visitor-counter-border visitor-counter-bottom-border"></div>
				<div className="visitor-counter-border visitor-counter-left-border"></div>
				<div className="visitor-counter-digits">
					{ padStart( count, 8, '0' ) }
				</div>
			</div>
		);
	},

	save() {
		return null;
	},
};
