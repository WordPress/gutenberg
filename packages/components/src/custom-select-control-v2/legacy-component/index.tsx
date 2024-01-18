/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
/**
 * Internal dependencies
 */
import _CustomSelect from '../custom-select';
import type { LegacyCustomSelectProps } from '../types';
import { CustomSelectItem } from '..';

function _LegacyCustomSelect( props: LegacyCustomSelectProps ) {
	// Forward props + store from v2 implementation
	const store = Ariakit.useSelectStore( {
		async setValue( value ) {
			if ( ! props.onChange ) return;

			// Executes the logic in a microtask after the popup is closed.
			// This is simply to ensure the isOpen state matches that in Downshift.
			await Promise.resolve();
			const state = store.getState();

			const changeObject = {
				selectedItem: {
					// Value will always be a string for the legacy component
					name: value as string,
					key: state.activeId as string,
				},
				highlightedIndex: state.renderedItems.findIndex(
					( item ) => item.value === value
				),
				isOpen: state.open,
			};
			props.onChange( changeObject );
		},
	} );

	const children = props.options.map(
		( { name, key, __experimentalHint, ...rest } ) => {
			const withHint = (
				<>
					<span>{ name }</span>
					<span className="components-custom-select-control__item-hint">
						{ __experimentalHint }
					</span>
				</>
			);

			return (
				<CustomSelectItem
					{ ...rest }
					key={ key }
					value={ name }
					children={
						props.__experimentalShowSelectedHint ? withHint : name
					}
				/>
			);
		}
	);

	const translatedProps = {
		'aria-describedby': props.describedBy,
		children,
		label: props.label,
	};

	return <_CustomSelect { ...translatedProps } store={ store } />;
}

export default _LegacyCustomSelect;
