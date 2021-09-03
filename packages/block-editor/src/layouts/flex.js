/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { appendSelectors } from './utils';

export default {
	name: 'flex',

	label: __( 'Flex' ),

	edit() {
		return null;
	},

	save: function FlexLayoutStyle( { selector } ) {
		return (
			<style>{ `
				${ appendSelectors( selector ) } {
					display: flex;
					gap: var( --wp--style--block-gap, 0.5em );
					flex-wrap: wrap;
					align-items: center;
				}

				${ appendSelectors( selector, '> *' ) } {
					margin: 0;
				}
			` }</style>
		);
	},

	getOrientation() {
		return 'horizontal';
	},

	getAlignments() {
		return [];
	},
};
