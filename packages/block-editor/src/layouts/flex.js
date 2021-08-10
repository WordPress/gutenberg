/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { appendSelectors } from './utils';
import { JustifyContentControl } from '../components/justify-content-control';

const HORIZONTAL_JUSTIFY_CONTROLS = {
	left: 'flex-start',
	center: 'center',
	right: 'flex-end',
	'space-between': 'space-between',
};

export default {
	name: 'flex',

	label: __( 'Flex' ),

	edit: function LayoutFlexEdit( { layout = {}, onChange } ) {
		const { justifyContent = 'flex-start' } = layout;
		return (
			<JustifyContentControl
				allowedControls={ Object.keys( HORIZONTAL_JUSTIFY_CONTROLS ) }
				value={ justifyContent }
				onChange={ ( value ) => {
					onChange( {
						...layout,
						justifyContent: HORIZONTAL_JUSTIFY_CONTROLS[ value ],
					} );
				} }
			/>
		);
	},

	save: function FlexLayoutStyle( { selector, layout = {} } ) {
		const { justifyContent = 'flex-start' } = layout;
		return (
			<style>{ `${ appendSelectors( selector ) } {
            display: flex;
            column-gap: 0.5em;
			flex-direction: row;
            justify-content: ${ justifyContent };
        }` }</style>
		);
	},

	getOrientation() {
		return 'horizontal';
	},

	getAlignments() {
		return [];
	},
	canInherit: false,
};
