import type * as Ariakit from '@ariakit/react';
import clsx from 'clsx';
import type { ForwardedRef } from 'react';
import { useInstanceId, useIsomorphicLayoutEffect } from '@wordpress/compose';
import { forwardRef, useContext } from '@wordpress/element';
import { Icon, check } from '@wordpress/icons';
import { CircularOptionPickerContext } from './circular-option-picker-context';
import Button from '../button';
import { Composite } from '../composite';
import { useCompositeContext } from '../composite/context';
import type { OptionProps } from './types';

function UnforwardedOptionAsButton(
	props: {
		id?: string;
		className?: string;
		isPressed?: boolean;
		label?: string;
	},
	forwardedRef: ForwardedRef< any >
) {
	const { isPressed, label, ...additionalProps } = props;
	return (
		<Button
			__next40pxDefaultSize
			{ ...additionalProps }
			aria-pressed={ isPressed }
			ref={ forwardedRef }
			label={ label }
		/>
	);
}

const OptionAsButton = forwardRef( UnforwardedOptionAsButton );

function UnforwardedOptionAsOption(
	props: {
		id: string;
		className?: string;
		isSelected?: boolean;
		label?: string;
	},
	forwardedRef: ForwardedRef< any >
) {
	const { id, isSelected, label, ...additionalProps } = props;

	const store = useCompositeContext().store as
		Ariakit.CompositeStore | undefined;

	// Make the selected option the initial active item. A layout effect runs
	// before `Composite` falls back to its first item. Later selection changes
	// do not move the active item, so Ariakit keeps the user's position.
	useIsomorphicLayoutEffect( () => {
		if ( isSelected && ! store?.getState().activeId ) {
			store?.setActiveId( id );
		}
	}, [ isSelected, store, id ] );

	return (
		<Composite.Item
			render={
				<Button
					__next40pxDefaultSize
					{ ...additionalProps }
					role="option"
					aria-selected={ !! isSelected }
					ref={ forwardedRef }
					label={ label }
				/>
			}
			id={ id }
		/>
	);
}

const OptionAsOption = forwardRef( UnforwardedOptionAsOption );

export function Option( {
	className,
	isSelected,
	selectedIconProps = {},
	tooltipText,
	...additionalProps
}: OptionProps ) {
	// Preserve the historical toggle-button fallback when this public
	// subcomponent is rendered without a parent picker.
	const { baseId, presentation = 'toggle-buttons' } = useContext(
		CircularOptionPickerContext
	);
	const id = useInstanceId(
		Option,
		baseId || 'components-circular-option-picker__option'
	);

	const commonProps = {
		id,
		className: 'components-circular-option-picker__option',
		...additionalProps,
	};

	const optionControl =
		presentation === 'listbox' ? (
			<OptionAsOption
				{ ...commonProps }
				label={ tooltipText }
				isSelected={ isSelected }
			/>
		) : (
			<OptionAsButton
				{ ...commonProps }
				label={ tooltipText }
				isPressed={
					presentation === 'toggle-buttons'
						? !! isSelected
						: undefined
				}
			/>
		);

	return (
		<div
			className={ clsx(
				className,
				'components-circular-option-picker__option-wrapper'
			) }
		>
			{ optionControl }
			{ presentation !== 'command-buttons' && isSelected && (
				<Icon icon={ check } { ...selectedIconProps } />
			) }
		</div>
	);
}
