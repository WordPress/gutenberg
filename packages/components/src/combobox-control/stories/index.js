/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ComboboxControl from '../';

export default {
	title: 'Components/ComboboxControl',
	component: ComboboxControl,
};

const options = [
	{
		value: 'small',
		label: 'Small',
	},
	{
		value: 'normal',
		label: 'Normal',
	},
	{
		value: 'large',
		label: 'Large',
	},
	{
		value: 'huge',
		label: 'Huge',
	},
];
function ComboboxControlWithState() {
	const [ filteredOptions, setFilteredOptions ] = useState( options );
	const [ value, setValue ] = useState( null );

	return (
		<>
			<ComboboxControl
				value={ value }
				onChange={ setValue }
				label="Font Size"
				options={ filteredOptions }
				onInputChange={ ( filter ) =>
					setFilteredOptions(
						options.filter( ( option ) =>
							option.label
								.toLowerCase()
								.startsWith( filter.toLowerCase() )
						)
					)
				}
			/>
			<p>Value: { value }</p>
		</>
	);
}
export const _default = () => <ComboboxControlWithState />;
