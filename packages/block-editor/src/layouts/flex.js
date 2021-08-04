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
			<style>{ `${ appendSelectors( selector ) } {
            display: flex;
            column-gap: 0.5em;
            align-items: center;
        }` }</style>
		);
	},

	getOrientation() {
		return 'horizontal';
	},

	getAlignments() {
		return [];
	},
};
