/**
 * Import WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const tabs = [
	{
		name: 'suggested',
		title: __( 'Suggested' ),
	},
	{
		name: 'blocks',
		title: __( 'Blocks' ),
	},
	{
		name: 'embeds',
		title: __( 'Embeds' ),
	},
	{
		name: 'shared',
		title: __( 'Shared' ),
	},
];

export default tabs;
