/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import _CustomSelect from '../custom-select';
import CustomSelectItem from '../item';
import type { LegacyCustomSelectProps } from '../types';
import * as Styled from '../styles';
import { ContextSystemProvider } from '../../context';

function CustomSelectControl( props: LegacyCustomSelectProps ) {
	const {
		__experimentalShowSelectedHint,
		__next40pxDefaultSize = false,
		options,
		onChange,
		size = 'default',
		value,
		...restProps
	} = props;

	// Forward props + store from v2 implementation
	const store = Ariakit.useSelectStore( {
		async setValue( nextValue ) {
			console.debug('nextValue: ', nextValue);
			if ( ! onChange ) return;

			// Executes the logic in a microtask after the popup is closed.
			// This is simply to ensure the isOpen state matches that in Downshift.
			await Promise.resolve();
			const state = store.getState();

			console.debug(state);

			const changeObject = {
				highlightedIndex: state.renderedItems.findIndex(
					( item ) => item.value === nextValue
				),
				inputValue: '',
				isOpen: state.open,
				selectedItem: {
					name: nextValue as string,
					key: nextValue as string, // @todo Why key and name have the same value?
					// @todo this structure is not compatible with the one from FontAppearanceControl, which
					// expects an `style` attribute. Probably something to be fixed in FontAppearanceControl? Or am I missing something here?
				},
				type: '',
			};
			onChange( changeObject );
		},
	} );

	const children = options.map(
		( { name, key, __experimentalHint, ...rest } ) => {
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
					{ ...rest }
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
			<>
				{ currentValue }
				<Styled.SelectedExperimentalHintItem className="components-custom-select-control__hint">
					{ currentHint?.__experimentalHint }
				</Styled.SelectedExperimentalHintItem>
			</>
		);
	};

	// translate legacy button sizing
	const contextSystemValue = useMemo( () => {
		let selectedSize;

		if (
			( __next40pxDefaultSize && size === 'default' ) ||
			size === '__unstable-large'
		) {
			selectedSize = 'default';
		} else if ( ! __next40pxDefaultSize && size === 'default' ) {
			selectedSize = 'compact';
		} else {
			selectedSize = size;
		}

		return {
			CustomSelectControlButton: { _overrides: { size: selectedSize } },
		};
	}, [ __next40pxDefaultSize, size ] );

	const translatedProps = {
		'aria-describedby': props.describedBy,
		children,
		renderSelectedValue: __experimentalShowSelectedHint
			? renderSelectedValueHint
			: undefined,
		...restProps,
	};

	return (
		<ContextSystemProvider value={ contextSystemValue }>
			<_CustomSelect { ...translatedProps } store={ store } />
		</ContextSystemProvider>
	);
}

export default CustomSelectControl;

// for backwards compatibility
export function StableCustomSelectControl( props: LegacyCustomSelectProps ) {
	console.debug(props);
	return (
		<CustomSelectControl
			{ ...props }
			__experimentalShowSelectedHint={ false }
		/>
	);
}
