/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { forwardRef, useContext, useEffect } from '@wordpress/element';
import { Icon, check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { CircularOptionPickerContext } from './circular-option-picker-context';
import Button from '../button';
import { Composite } from '../composite';
import Tooltip from '../tooltip';
import type { OptionProps } from './types';

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
	},
	forwardedRef: ForwardedRef< any >
) {
	const { id, isSelected, ...additionalProps } = props;

	const { setActiveId, activeId } = useContext( CircularOptionPickerContext );

	useEffect( () => {
		if ( isSelected && ! activeId ) {
			// The setTimeout call is necessary to make sure that this update
			// doesn't get overridden by `Composite`'s internal logic, which picks
			// an initial active item if one is not specifically set.
			window.setTimeout( () => setActiveId?.( id ), 0 );
		}
	}, [ isSelected, setActiveId, activeId, id ] );

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
	const { baseId, setActiveId } = useContext( CircularOptionPickerContext );
	const id = useInstanceId(
		Option,
		baseId || 'components-circular-option-picker__option'
	);

	const commonProps = {
		id,
		className: 'components-circular-option-picker__option',
		...additionalProps,
	};

	const isListbox = setActiveId !== undefined;
	const optionControl = isListbox ? (
		<OptionAsOption { ...commonProps } isSelected={ isSelected } />
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
