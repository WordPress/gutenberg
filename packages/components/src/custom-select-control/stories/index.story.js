/**
 * Internal dependencies
 */
import CustomSelectControl from '..';

export default {
	title: 'Components/CustomSelectControl',
	component: CustomSelectControl,
	argTypes: {
		__next40pxDefaultSize: { control: { type: 'boolean' } },
		__experimentalShowSelectedHint: { control: { type: 'boolean' } },
		size: {
			options: [ 'small', 'default', '__unstable-large' ],
			control: {
				type: 'radio',
			},
		},
	},
};

export const Default = CustomSelectControl.bind( {} );
Default.args = {
	__nextUnconstrainedWidth: true,
	label: 'Label',
	options: [
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
	],
};

export const WithCustomOptions = CustomSelectControl.bind( {} );
WithCustomOptions.args = {
	...Default.args,
	options: [
		{
			key: 'thumbnail',
			name: (
				<div>
					<span className="title">Thumbnail </span>
					<span clasName="size">50px </span>
				</div>
			),
			selectionMessage: 'Thumbnail',
		},
		{
			key: 'medium',
			name: (
				<div>
					<span className="title">Medium </span>
					<span clasName="size">100px</span>
				</div>
			),
			selectionMessage: 'Medium',
		},
		{
			key: 'large',
			name: (
				<div>
					<span className="title">Large </span>
					<span clasName="size">200px </span>
				</div>
			),
			selectionMessage: 'Large',
		},
	],
	itemToString: ( item ) => item.selectionMessage,
};

export const WithLongLabels = CustomSelectControl.bind( {} );
WithLongLabels.args = {
	...Default.args,
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
			name: 'That really is ok though because you should stress test your UIs.',
		},
	],
};

export const WithHints = CustomSelectControl.bind( {} );
WithHints.args = {
	...Default.args,
	options: [
		{
			key: 'thumbnail',
			name: 'Thumbnail',
			__experimentalHint: '150x150',
		},
		{
			key: 'medium',
			name: 'Medium',
			__experimentalHint: '250x250',
		},
		{
			key: 'large',
			name: 'Large',
			__experimentalHint: '1024x1024',
		},
		{
			key: 'full',
			name: 'Full Size',
			__experimentalHint: '1600x1600',
		},
	],
};
