/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { cx } from '@emotion/css';
// eslint-disable-next-line no-restricted-imports
import { RadioGroup, useRadioState } from 'reakit';
import useResizeAware from 'react-resize-aware';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef, useMemo, createContext, useContext } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	PolymorphicComponentProps,
} from '../ui/context';
import { View } from '../view';
import * as styles from './styles';
import { useUpdateEffect } from '../utils/hooks';
import Backdrop from './segmented-control-backdrop';
import Button from './segmented-control-button';
import type {
	SegmentedControlProps,
	SegmentedControlOption,
	SegmentedControlRadioState,
} from './types';

const noop = () => {};
const RadioContext = createContext( {} as SegmentedControlRadioState );

function SegmentControl(
	props: PolymorphicComponentProps< SegmentedControlProps, 'input' >,
	forwardedRef: import('react').Ref< any >
) {
	const {
		className,
		baseId,
		isAdaptiveWidth = false,
		isBlock = false,
		id,
		label,
		onChange = noop,
		value,
		children,
		...otherProps
	} = useContextSystem( props, 'SegmentedControl' );

	const containerRef = useRef();
	const [ resizeListener, sizes ] = useResizeAware();

	const radio = useRadioState( {
		baseId: baseId || id,
		state: value,
	} );

	// Propagate radio.state change
	useUpdateEffect( () => {
		onChange( radio.state );
	}, [ radio.state ] );

	// Sync incoming value with radio.state
	useUpdateEffect( () => {
		if ( value !== radio.state ) {
			radio.setState( value );
		}
	}, [ value ] );

	const classes = useMemo(
		() =>
			cx(
				styles.SegmentedControl,
				isBlock && styles.block,
				'medium',
				className
			),
		[ className ]
	);
	return (
		<RadioContext.Provider
			value={ { ...radio, isBlock: ! isAdaptiveWidth } }
		>
			<RadioGroup
				{ ...radio }
				aria-label={ label }
				as={ View }
				className={ classes }
				{ ...otherProps }
				ref={ useMergeRefs( [ containerRef, forwardedRef ] ) }
			>
				{ resizeListener }
				<Backdrop
					{ ...radio }
					containerRef={ containerRef }
					containerWidth={ sizes.width }
				/>
				{ children }
			</RadioGroup>
		</RadioContext.Provider>
	);
}

function getShowSeparator( radio: any, index: number ) {
	const { currentId, items } = radio;
	const isLast = index === items.length - 1;
	const isActive = items[ index ]?.id === currentId;
	const isNextActive = items[ index + 1 ]?.id === currentId;

	let showSeparator = true;

	if ( items.length < 3 ) {
		showSeparator = false;
	}

	if ( isActive || isNextActive || isLast ) {
		showSeparator = false;
	}

	return showSeparator;
}

function ControlOption(
	props: PolymorphicComponentProps< SegmentedControlOption, 'input' >,
	forwardedRef: import('react').Ref< any >
) {
	const radio = useContext( RadioContext );
	const buttonProps = useContextSystem( props, 'SegmentedControlOption' );
	const index = radio.items.findIndex(
		( item: any ) => item.id === buttonProps.id
	);
	const showSeparator = getShowSeparator( radio, index );
	return (
		<Button
			ref={ forwardedRef }
			{ ...{ ...radio, ...buttonProps, showSeparator } }
		/>
	);
}

const ConnectedSegmentedControl: any = contextConnect(
	SegmentControl,
	'SegmentControl'
);
const ConnectedSegmentedControlOption = contextConnect(
	ControlOption,
	'SegmentedControlOption'
);
ConnectedSegmentedControl.Option = ConnectedSegmentedControlOption;

export default ConnectedSegmentedControl;
