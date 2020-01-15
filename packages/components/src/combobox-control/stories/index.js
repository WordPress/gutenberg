/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ComboboxControl from '../';

export default { title: 'ComboboxControl', component: ComboboxControl };

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
function ComboboxControlWithState() {
	const [ filteredOptions, setFilteredOptions ] = useState( options );
	return (
		<ComboboxControl
			label="Font Size"
			options={ filteredOptions }
			onInputValueChange={ ( { inputValue } ) =>
				setFilteredOptions(
					options.filter( ( option ) =>
						option.name
							.toLowerCase()
							.startsWith( inputValue.toLowerCase() )
					)
				)
			}
		/>
	);
}
export const _default = () => <ComboboxControlWithState />;
