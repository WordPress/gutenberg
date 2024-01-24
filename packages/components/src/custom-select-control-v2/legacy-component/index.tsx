/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
/**
 * Internal dependencies
 */
import _CustomSelect from '../custom-select';
import type { LegacyCustomSelectProps } from '../types';
import { CustomSelectItem } from '..';
import { ExperimentalHint, ExperimentalHintItem } from '../styles';

function _LegacyCustomSelect( props: LegacyCustomSelectProps ) {
	const {
		__experimentalShowSelectedHint,
		__next40pxDefaultSize = false,
		__nextUnconstrainedWidth,
		options,
		onChange,
		// TO-DO 'default' should be the 'compact' size
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
		( { name, key, style, __experimentalHint, ...rest } ) => {
			const withHint = (
				<>
					<span>{ name }</span>
					<ExperimentalHintItem className="components-custom-select-control__item-hint">
						{ __experimentalHint }
					</ExperimentalHintItem>
				</>
			);

			const hintStyles = {
				gridTemplateColumns: __experimentalShowSelectedHint
					? '1fr auto 30px'
					: undefined,
			};

			return (
				<CustomSelectItem
					key={ key }
					value={ name }
					children={
						__experimentalShowSelectedHint ? withHint : name
					}
					style={ { ...hintStyles, ...style } }
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
				<ExperimentalHint className="components-custom-select-control__hint">
					{ currentHint?.__experimentalHint }
				</ExperimentalHint>
			</>
		);
	};

	const translatedProps = {
		'aria-describedby': props.describedBy,
		children,
		renderSelectedValue: __experimentalShowSelectedHint
			? renderSelectedValueHint
			: undefined,
		size:
			__next40pxDefaultSize || size === '__unstable-large'
				? 'default'
				: size,
		...restProps,
	};

	return (
		<_CustomSelect
			{ ...translatedProps }
			store={ store }
			style={ {
				gridTemplateColumns: __experimentalShowSelectedHint
					? 'auto 1fr 30px'
					: undefined,
			} }
		/>
	);
}

export default _LegacyCustomSelect;
