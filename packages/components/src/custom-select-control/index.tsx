/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import _CustomSelect from '../custom-select-control-v2/custom-select';
import CustomSelectItem from '../custom-select-control-v2/item';
import * as Styled from '../custom-select-control-v2/styles';
import type { CustomSelectProps, CustomSelectOption } from './types';
import { VisuallyHidden } from '../visually-hidden';
import { maybeWarnDeprecated36pxSize } from '../utils/deprecated-36px-size';

function useDeprecatedProps< T extends CustomSelectOption >( {
	__experimentalShowSelectedHint,
	...otherProps
}: CustomSelectProps< T > ) {
	return {
		showSelectedHint: __experimentalShowSelectedHint,
		...otherProps,
	};
}

// The removal of `__experimentalHint` in favour of `hint` doesn't happen in
// the `useDeprecatedProps` hook in order not to break consumers that rely
// on object identity (see https://github.com/WordPress/gutenberg/pull/63248#discussion_r1672213131)
function applyOptionDeprecations( {
	__experimentalHint,
	...rest
}: CustomSelectOption ) {
	return {
		hint: __experimentalHint,
		...rest,
	};
}

function getDescribedBy( currentValue: string, describedBy?: string ) {
	if ( describedBy ) {
		return describedBy;
	}

	// translators: %s: The selected option.
	return sprintf( __( 'Currently selected: %s' ), currentValue );
}

function CustomSelectControl< T extends CustomSelectOption >(
	props: CustomSelectProps< T >
) {
	const {
		__next40pxDefaultSize = false,
		__shouldNotWarnDeprecated36pxSize,
		describedBy,
		options,
		onChange,
		size = 'default',
		value,
		className: classNameProp,
		showSelectedHint = false,
		...restProps
	} = useDeprecatedProps( props );

	maybeWarnDeprecated36pxSize( {
		componentName: 'CustomSelectControl',
		__next40pxDefaultSize,
		size,
		__shouldNotWarnDeprecated36pxSize,
	} );

	const descriptionId = useInstanceId(
		CustomSelectControl,
		'custom-select-control__description'
	);

	// Forward props + store from v2 implementation
	const store = Ariakit.useSelectStore< string >( {
		async setValue( nextValue ) {
			const nextOption = options.find(
				( item ) => item.name === nextValue
			);

			if ( ! onChange || ! nextOption ) {
				return;
			}

			// Executes the logic in a microtask after the popup is closed.
			// This is simply to ensure the isOpen state matches the one from the
			// previous legacy implementation.
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

	const children = options
		.map( applyOptionDeprecations )
		.map( ( { name, key, hint, style, className } ) => {
			const withHint = (
				<Styled.WithHintItemWrapper>
					<span>{ name }</span>
					<Styled.WithHintItemHint
						// Keeping the classname for legacy reasons
						className="components-custom-select-control__item-hint"
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
						className,
						// Keeping the classnames for legacy reasons
						'components-custom-select-control__item',
						{
							'has-hint': hint,
						}
					) }
				/>
			);
		} );

	const currentValue = Ariakit.useStoreState( store, 'value' );

	const renderSelectedValueHint = () => {
		const selectedOptionHint = options
			?.map( applyOptionDeprecations )
			?.find( ( { name } ) => currentValue === name )?.hint;

		return (
			<Styled.SelectedExperimentalHintWrapper>
				{ currentValue }
				{ selectedOptionHint && (
					<Styled.SelectedExperimentalHintItem
						// Keeping the classname for legacy reasons
						className="components-custom-select-control__hint"
					>
						{ selectedOptionHint }
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
		<>
			<_CustomSelect
				aria-describedby={ descriptionId }
				renderSelectedValue={
					showSelectedHint ? renderSelectedValueHint : undefined
				}
				size={ translatedSize }
				store={ store }
				className={ clsx(
					// Keeping the classname for legacy reasons
					'components-custom-select-control',
					classNameProp
				) }
				isLegacy
				{ ...restProps }
			>
				{ children }
			</_CustomSelect>
			<VisuallyHidden>
				<span id={ descriptionId }>
					{ getDescribedBy( currentValue, describedBy ) }
				</span>
			</VisuallyHidden>
		</>
	);
}

export default CustomSelectControl;
