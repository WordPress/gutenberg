/**
 * Internal dependencies
 */
import CustomSelectControl from '../';

export default { title: 'CustomSelectControl', component: CustomSelectControl };

const options = [
	{
		key: 'small',
		name: 'Small',
		style: { fontSize: '50%' },
	},
	{
		key: 'normal',
		name: 'Normal',
		style: { fontSize: '100%' },
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
export const _default = () => (
	<CustomSelectControl label="Font Size" options={ options } />
);
