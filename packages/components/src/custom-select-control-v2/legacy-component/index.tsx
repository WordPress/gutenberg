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

function _LegacyCustomSelect( props: LegacyCustomSelectProps ) {
	const {
		__experimentalShowSelectedHint,
		__nextUnconstrainedWidth,
		options,
		onChange,
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
	} );

	const children = options.map(
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
						__experimentalShowSelectedHint ? withHint : name
					}
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

	const translatedProps = {
		'aria-describedby': props.describedBy,
		children,
		...restProps,
	};

	return <_CustomSelect { ...translatedProps } store={ store } />;
}

export default _LegacyCustomSelect;
