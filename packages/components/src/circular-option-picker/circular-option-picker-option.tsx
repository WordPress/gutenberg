/**
 * External dependencies
 */
import classnames from 'classnames';
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
import { CompositeItem } from '../composite/v2';
import Tooltip from '../tooltip';
import type {
	OptionProps,
	CircularOptionPickerCompositeStore,
	CircularOptionPickerContextProps,
} from './types';

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
		context: CircularOptionPickerContextProps;
	},
	forwardedRef: ForwardedRef< any >
) {
	const { id, isSelected, context, ...additionalProps } = props;
	const { isComposite, baseId, ..._compositeStore } = context;
	const compositeStore =
		_compositeStore as CircularOptionPickerCompositeStore;
	const { setActiveId } = compositeStore;
	const activeId = compositeStore.useState( 'activeId' );

	if ( isSelected && ! activeId ) {
		setActiveId( id );
	}

	return (
		<CompositeItem
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
