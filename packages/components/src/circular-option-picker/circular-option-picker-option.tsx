/**
 * External dependencies
 */
import classnames from 'classnames';
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
import { CompositeItem } from '../composite';
import Tooltip from '../tooltip';
import type {
	OptionProps,
	CircularOptionPickerCompositeState,
	CircularOptionPickerContextProps,
} from './types';

const hasSelectedOption = new Map();

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
		></Button>
	);
}

const OptionAsButton = forwardRef( UnforwardedOptionAsButton );

function UnforwardedOptionAsOption(
	props: {
		id: string;
		className?: string;
		isSelected?: boolean;
		context: CircularOptionPickerContextProps;
	},
	forwardedRef: ForwardedRef< any >
) {
	const { id, isSelected, context, ...additionalProps } = props;
	const { isComposite, ..._compositeState } = context;
	const compositeState =
		_compositeState as CircularOptionPickerCompositeState;
	const { baseId, currentId, setCurrentId } = compositeState;

	useEffect( () => {
		// If we call `setCurrentId` here, it doesn't update for other
		// Option renders in the same pass. So we have to store our own
		// map to make sure that we only set the first selected option.
		// We still need to check `currentId` because the control will
		// update this as the user moves around, and that state should
		// be maintained as the group gains and loses focus.
		if ( isSelected && ! currentId && ! hasSelectedOption.get( baseId ) ) {
			hasSelectedOption.set( baseId, true );
			setCurrentId( id );
		}
	}, [ baseId, currentId, id, isSelected, setCurrentId ] );

	return (
		<CompositeItem
			{ ...additionalProps }
			{ ...compositeState }
			as={ Button }
			id={ id }
			role="option"
			aria-selected={ !! isSelected }
			ref={ forwardedRef }
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
	const compositeContext = useContext( CircularOptionPickerContext );
	const { isComposite, baseId } = compositeContext;
	const id = useInstanceId(
		Option,
		baseId || 'components-circular-option-picker__option'
	);

	const commonProps = {
		id,
		className: 'components-circular-option-picker__option',
		...additionalProps,
	};

	const optionControl = isComposite ? (
		<OptionAsOption
			{ ...commonProps }
			context={ compositeContext }
			isSelected={ isSelected }
		/>
	) : (
		<OptionAsButton { ...commonProps } isPressed={ isSelected } />
	);

	return (
		<div
			className={ classnames(
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
