/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import _CustomSelect from '../custom-select';
import CustomSelectItem from '../item';
import type { LegacyCustomSelectProps, LegacyOption } from '../types';
import * as Styled from '../styles';

function useDeprecatedProps( {
	showSelectedHint = false,
	// Deprecated
	__experimentalShowSelectedHint,
	...otherProps
}: LegacyCustomSelectProps ) {
	return {
		...otherProps,
		showSelectedHint:
			typeof __experimentalShowSelectedHint !== 'undefined'
				? __experimentalShowSelectedHint
				: showSelectedHint,
	};
}
const computeOptionDeprecatedProps = ( {
	__experimentalHint,
	hint,
	...rest
}: LegacyOption ) => ( {
	...rest,
	hint: typeof __experimentalHint !== 'undefined' ? __experimentalHint : hint,
} );

function CustomSelectControl( props: LegacyCustomSelectProps ) {
	const {
		__next40pxDefaultSize = false,
		describedBy,
		options,
		onChange,
		size = 'default',
		value,
		className: classNameProp,
		showSelectedHint,
		...restProps
	} = useDeprecatedProps( props );

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

	const children = options.map( ( option ) => {
		const { name, key, hint, style, className } =
			computeOptionDeprecatedProps( option );

		const withHint = (
			<Styled.WithHintItemWrapper>
				<span>{ name }</span>
				<Styled.WithHintItemHint
				// TODO: Legacy classname. Add V1 styles are removed from the codebase
				// className="components-custom-select-control__item-hint"
				>
					{ hint }
				</Styled.WithHintItemHint>
			</Styled.WithHintItemWrapper>
		);

		return (
			<CustomSelectItem
				key={ key }
				value={ name }
				children={ hint ? withHint : name }
				style={ style }
				className={ clsx(
					// TODO: Legacy classname. Add V1 styles are removed from the codebase
					// 'components-custom-select-control__item',
					className
					// TODO: Legacy classname. Add V1 styles are removed from the codebase
					// {
					// 	'has-hint': hint,
					// }
				) }
			/>
		);
	} );

	const renderSelectedValueHint = () => {
		const { value: currentValue } = store.getState();

		const selectedOption = options?.find(
			( { name } ) => currentValue === name
		);

		return (
			<Styled.SelectedExperimentalHintWrapper>
				{ currentValue }
				{ selectedOption && (
					<Styled.SelectedExperimentalHintItem
					// TODO: Legacy classname. Add V1 styles are removed from the codebase
					// className="components-custom-select-control__hint"
					>
						{ computeOptionDeprecatedProps( selectedOption )?.hint }
					</Styled.SelectedExperimentalHintItem>
				) }
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
				showSelectedHint ? renderSelectedValueHint : undefined
			}
			size={ translatedSize }
			store={ store }
			className={ clsx(
				// TODO: Legacy classname. Add V1 styles are removed from the codebase
				// 'components-custom-select-control',
				classNameProp
			) }
			isLegacy
			{ ...restProps }
		>
			{ children }
		</_CustomSelect>
	);
}

export default CustomSelectControl;
