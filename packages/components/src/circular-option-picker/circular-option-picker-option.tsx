/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useContext, useEffect } from '@wordpress/element';
import { Icon, check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { CircularOptionPickerContext } from './circular-option-picker-context';
import Button from '../button';
import { CompositeItem } from '../composite';
import Tooltip from '../tooltip';
import type { OptionProps } from './types';

const hasSelectedOption = new Map();

function renderOptionAsButton( props: {
	className?: string;
	isPressed?: boolean;
} ) {
	return <Button { ...props }></Button>;
}

function renderOptionAsOption( props: {
	id: string;
	className?: string;
	isSelected?: boolean;
	compositeState: any;
} ) {
	const { className, isSelected, compositeState, ...additionalProps } = props;

	return (
		<CompositeItem
			{ ...additionalProps }
			{ ...compositeState }
			as={ Button }
			className={ classnames( className, {
				'is-pressed': isSelected,
			} ) }
			role="option"
			aria-selected={ !! isSelected }
		/>
	);
}

export function Option( {
	className,
	isSelected,
	selectedIconProps = {},
	tooltipText,
	...additionalProps
}: OptionProps ) {
	const compositeState = useContext( CircularOptionPickerContext );
	const { baseId, currentId, setCurrentId } = compositeState as any;
	const isComposite = !! baseId;
	const id = useInstanceId( Option, baseId );

	useEffect( () => {
		// If we call `setCurrentId` here, it doesn't update for other
		// Option renders in the same pass. So we have to store our own
		// map to make sure that we only set the first selected option.
		// We still need to check `currentId` because the control will
		// update this as the user moves around, and that state should
		// be maintained as the group gains and loses focus.
		if (
			isComposite &&
			isSelected &&
			! currentId &&
			! hasSelectedOption.get( baseId )
		) {
			hasSelectedOption.set( baseId, true );
			setCurrentId( id );
		}
	}, [ baseId, currentId, id, isComposite, isSelected, setCurrentId ] );

	const optionControl = isComposite
		? renderOptionAsOption( {
				id,
				className: 'components-circular-option-picker__option',
				isSelected,
				compositeState,
				...additionalProps,
		  } )
		: renderOptionAsButton( {
				id,
				className: 'components-circular-option-picker__option',
				isPressed: isSelected,
				...additionalProps,
		  } );

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
