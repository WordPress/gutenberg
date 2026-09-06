import { createElement } from '@wordpress/element';

export const moduleIcon = createElement( 'svg', {
	viewBox: '0 0 24 24',
} );

export default {
	apiVersion: 1,
	title: 'Store',
	icon: moduleIcon,
	attributes: [
		{
			id: 'location',
			label: 'Location',
			type: 'test/location',
		},
		{ id: 'label', label: 'Label', type: 'text' },
	],
	actions: [
		{
			id: 'module-action',
			label: 'Module action',
			href: 'https://example.com/module',
			icon: moduleIcon,
		},
	],
};
