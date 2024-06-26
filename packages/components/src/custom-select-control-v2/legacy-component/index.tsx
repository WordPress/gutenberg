/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * Internal dependencies
 */
import _CustomSelect from '../custom-select';
import CustomSelectItem from '../item';
import type { LegacyCustomSelectProps } from '../types';
import * as Styled from '../styles';

function CustomSelectControl( props: LegacyCustomSelectProps ) {
	const {
		__experimentalShowSelectedHint = false,
		__next40pxDefaultSize = false,
		describedBy,
		options,
		onChange,
		size = 'default',
		value,
		...restProps
	} = props;

	// Forward props + store from v2 implementation
	const store = Ariakit.useSelectStore( {
		async setValue( nextValue ) {
			const nextOption = options.find(
				( item ) => item.name === nextValue
			);

			if ( ! onChange || ! nextOption ) {
				return;
			}

			// Executes the logic in a microtask after the popup is closed.
			// This is simply to ensure the isOpen state matches that in Downshift.
			await Promise.resolve();
			const state = store.getState();

			const changeObject = {
				highlightedIndex: state.renderedItems.findIndex(
					( item ) => item.value === nextValue
				),
				inputValue: '',
				isOpen: state.open,
				selectedItem: nextOption,
				type: '',
			};
			onChange( changeObject );
		},
		value: value?.name,
		// Setting the first option as a default value when no value is provided
		// is already done natively by the underlying Ariakit component,
		// but doing this explicitly avoids the `onChange` callback from firing
		// on initial render, thus making this implementation closer to the v1.
		defaultValue: options[ 0 ]?.name,
	} );

	const children = options.map(
		( { name, key, __experimentalHint, style, className } ) => {
			const withHint = (
				<Styled.WithHintWrapper>
					<span>{ name }</span>
					<Styled.ExperimentalHintItem className="components-custom-select-control__item-hint">
						{ __experimentalHint }
					</Styled.ExperimentalHintItem>
				</Styled.WithHintWrapper>
			);

			return (
				<CustomSelectItem
					key={ key }
					value={ name }
					children={ __experimentalHint ? withHint : name }
					style={ style }
					className={ className }
				/>
			);
		}
	);

	const renderSelectedValueHint = () => {
		const { value: currentValue } = store.getState();

		const currentHint = options?.find(
			( { name } ) => currentValue === name
		);

		return (
			<Styled.SelectedExperimentalHintWrapper>
				{ currentValue }
				<Styled.SelectedExperimentalHintItem className="components-custom-select-control__hint">
					{ currentHint?.__experimentalHint }
				</Styled.SelectedExperimentalHintItem>
			</Styled.SelectedExperimentalHintWrapper>
		);
	};

	const translatedSize = ( () => {
		if (
			( __next40pxDefaultSize && size === 'default' ) ||
			size === '__unstable-large'
		) {
			return 'default';
		}
		if ( ! __next40pxDefaultSize && size === 'default' ) {
			return 'compact';
		}
		return size;
	} )();

	return (
		<_CustomSelect
			aria-describedby={ describedBy }
			renderSelectedValue={
				__experimentalShowSelectedHint
					? renderSelectedValueHint
					: undefined
			}
			size={ translatedSize }
			store={ store }
			{ ...restProps }
		>
			{ children }
		</_CustomSelect>
	);
}

export default CustomSelectControl;
