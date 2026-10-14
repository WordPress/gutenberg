import { __ } from '@wordpress/i18n';
import { customLink as linkIcon } from '@wordpress/icons';

const variations = [
	{
		name: 'custom-link',
		title: __( 'Custom Link' ),
		description: __( 'Add a custom link to your navigation.' ),
		icon: linkIcon,
		attributes: {
			kind: 'custom',
		},
		isActive: ( blockAttributes ) => blockAttributes.kind === 'custom',
		isDefault: true,
		scope: [ 'inserter' ],
	},
];

export default variations;
