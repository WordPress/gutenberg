/**
 * Internal dependencies
 */
import CustomSelectControl from '../';

export default {
	title: 'Components/CustomSelectControl',
	component: CustomSelectControl,
};

const defaultOptions = [
	{
		key: 'small',
		name: 'Small',
		style: { fontSize: '50%' },
	},
	{
		key: 'normal',
		name: 'Normal',
		style: { fontSize: '100%' },
		className: 'can-apply-custom-class-to-option',
	},
	{
		key: 'large',
		name: 'Large',
		style: { fontSize: '200%' },
	},
	{
		key: 'huge',
		name: 'Huge',
		style: { fontSize: '300%' },
	},
];

export const Default = CustomSelectControl.bind( {} );
Default.args = {
	hideLabelFromVision: false,
	label: 'Font size',
	options: defaultOptions,
};

export const LongLabels = CustomSelectControl.bind( {} );
LongLabels.args = {
	...Default.args,
	label: 'Testing long labels',
	options: [
		{
			key: 'reallylonglabel1',
			name: 'Really long labels are good for stress testing',
		},
		{
			key: 'reallylonglabel2',
			name: 'But they can take a long time to type.',
		},
		{
			key: 'reallylonglabel3',
			name:
				'That really is ok though because you should stress test your UIs.',
		},
	],
};
