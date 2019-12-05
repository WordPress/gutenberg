/**
 * Internal dependencies
 */
import CustomSelect from '../';

export default { title: 'CustomSelect', component: CustomSelect };

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
	<CustomSelect label="Font Size" options={ options } />
);
