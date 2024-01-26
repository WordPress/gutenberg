/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import _CustomSelect from '../custom-select';
import type { LegacyCustomSelectProps } from '../types';
import { CustomSelectItem } from '..';
import * as Styled from '../styles';
import { ContextSystemProvider } from '../../context';

function _LegacyCustomSelect( props: LegacyCustomSelectProps ) {
	const {
		__experimentalShowSelectedHint,
		__next40pxDefaultSize = false,
		__nextUnconstrainedWidth,
		options,
		onChange,
		size = 'default',
		value: valueProp,
		...restProps
	} = props;

	// Forward props + store from v2 implementation
	const store = Ariakit.useSelectStore( {
		async setValue( value ) {
			if ( ! onChange ) return;

			// Executes the logic in a microtask after the popup is closed.
			// This is simply to ensure the isOpen state matches that in Downshift.
			await Promise.resolve();
			const state = store.getState();

			const changeObject = {
				highlightedIndex: state.renderedItems.findIndex(
					( item ) => item.value === value
				),
				inputValue: '',
				isOpen: state.open,
				selectedItem: {
					// Value will always be a string for the legacy component
					name: value as string,
					key: value as string,
				},
				type: '',
			};
			onChange( changeObject );
		},
		defaultValue: options[ 0 ].name,
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
					children={
						__experimentalShowSelectedHint ? withHint : name
					}
					{ ...rest }
				/>
			);
		}
	);

	if ( __nextUnconstrainedWidth ) {
		deprecated(
			'Constrained width styles for wp.components.CustomSelectControl',
			{
				hint: 'This behaviour is now built-in.',
				since: '6.4',
			}
		);
	}

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

export default _LegacyCustomSelect;
