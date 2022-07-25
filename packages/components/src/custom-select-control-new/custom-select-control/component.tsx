/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import { Select, SelectLabel, SelectPopover } from 'ariakit/select';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelectControl } from './hook';
import type { WordPressComponentProps } from '../../ui/context';
import { CustomSelectControlItem, CustomSelectControlArrow } from '../';
import type { SelectControlOption, SelectControlProps } from '../types';

const SelectControlCustomSelectLabel = ( {
	options,
	value,
}: {
	options: SelectControlOption[];
	value?: string;
} ) => (
	<>
		{ /* Use the label associated to the option's value, fallback to the value itself */ }
		{ options.find( ( option ) => option.value === value )?.label ?? value }
		<CustomSelectControlArrow />
	</>
);

const UnforwardedSelectControl = (
	props: WordPressComponentProps< SelectControlProps, 'select', false >,
	forwardedRef: ForwardedRef< any >
) => {
	const {
		label,
		options,
		children,
		selectState,
		wrapperClassName,
		labelClassName,
		selectClassName,
		popoverClassName,
	} = useSelectControl( props );

	return (
		<div className={ wrapperClassName }>
			<SelectLabel state={ selectState } className={ labelClassName }>
				{ label }
			</SelectLabel>
			<Select
				state={ selectState }
				className={ selectClassName }
				// TODO: where should the ref be forwarded?
				ref={ forwardedRef }
			>
				{ options?.length ? (
					<SelectControlCustomSelectLabel
						options={ options }
						value={ selectState.value }
					/>
				) : (
					// TODO: add support for custom render function
					<>
						{ selectState.value }
						<CustomSelectControlArrow />
					</>
				) }
			</Select>
			<SelectPopover state={ selectState } className={ popoverClassName }>
				{ children ??
					options?.map( ( option, index ) => {
						const key =
							option.id ||
							`${ option.label }-${ option.value }-${ index }`;
						return (
							<CustomSelectControlItem
								key={ key }
								value={ option.value }
								disabled={ option.disabled }
							>
								{ option.label }
							</CustomSelectControlItem>
						);
					} ) }
			</SelectPopover>
		</div>
	);
};

// TODO: JSDocs
export const SelectControl = forwardRef( UnforwardedSelectControl );

export default SelectControl;
