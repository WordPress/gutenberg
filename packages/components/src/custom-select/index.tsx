/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * Internal dependencies
 */
import {
	CustomSelectButton,
	CustomSelectPopover,
	CustomSelectItem as SelectItem,
} from './styles';
import { type CustomSelectProps } from './types';

export function CustomSelect( props: CustomSelectProps ) {
	const { label, onChange, options } = props;

	const store = Ariakit.useSelectStore( {
		setValue: ( value ) => onChange?.( value ),
	} );

	return (
		<>
			<Ariakit.SelectLabel store={ store }>{ label }</Ariakit.SelectLabel>
			<CustomSelectButton store={ store } />
			<CustomSelectPopover sameWidth store={ store }>
				{ options?.map( ( { name, key, ...rest } ) => {
					return (
						<SelectItem value={ name } key={ key } { ...rest } />
					);
				} ) }
			</CustomSelectPopover>
		</>
	);
}
