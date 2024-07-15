/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { forwardRef, useContext } from '@wordpress/element';
import { Icon, check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { CircularOptionPickerContext } from './circular-option-picker-context';
import Button from '../button';
import * as Composite from '../composite';
import Tooltip from '../tooltip';
import type { OptionProps, CircularOptionPickerCompositeStore } from './types';

function UnforwardedOptionAsButton(
	props: {
		id?: string;
		className?: string;
		isPressed?: boolean;
	},
	forwardedRef: ForwardedRef< any >
) {
	const { isPressed, ...additionalProps } = props;
	return (
		<Button
			{ ...additionalProps }
			aria-pressed={ isPressed }
			ref={ forwardedRef }
		/>
	);
}

const OptionAsButton = forwardRef( UnforwardedOptionAsButton );

function UnforwardedOptionAsOption(
	props: {
		id: string;
		className?: string;
		isSelected?: boolean;
		compositeStore: CircularOptionPickerCompositeStore;
	},
	forwardedRef: ForwardedRef< any >
) {
	const { id, isSelected, compositeStore, ...additionalProps } = props;
	const activeId = compositeStore.useState( 'activeId' );

	if ( isSelected && ! activeId ) {
		compositeStore.setActiveId( id );
	}

	return (
		<Composite.Item
			render={
				<Button
					{ ...additionalProps }
					role="option"
					aria-selected={ !! isSelected }
					ref={ forwardedRef }
				/>
			}
			store={ compositeStore }
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
	const { baseId, compositeStore } = useContext(
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

	const optionControl = compositeStore ? (
		<OptionAsOption
			{ ...commonProps }
			compositeStore={ compositeStore }
			isSelected={ isSelected }
		/>
	) : (
		<OptionAsButton { ...commonProps } isPressed={ isSelected } />
	);

	return (
		<div
			className={ clsx(
				className,
				'components-circular-option-picker__option-wrapper'
			) }
		>
			{ tooltipText ? (
				<Tooltip text={ tooltipText }>{ optionControl }</Tooltip>
			) : (
				optionControl
			) }
			{ isSelected && <Icon icon={ check } { ...selectedIconProps } /> }
		</div>
	);
}
