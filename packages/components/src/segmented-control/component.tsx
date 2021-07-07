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
import { useRef, useMemo } from '@wordpress/element';
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
import type { SegmentedControlProps } from './types';

const noop = () => {};

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
		options = [],
		onChange = noop,
		value,
		...otherProps
	} = useContextSystem( props, 'SegmentedControl' );

	const containerRef = useRef();
	const [ resizeListener, sizes ] = useResizeAware();

	const radio = useRadioState( {
		baseId: baseId || id,
		state: value || options[ 0 ]?.value,
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
			{ options.map( ( option: any, index: number ) => {
				const showSeparator = getShowSeparator( radio, index );
				return (
					<Button
						{ ...radio }
						{ ...option }
						isBlock={ ! isAdaptiveWidth }
						key={ option.value || index }
						showSeparator={ showSeparator }
					/>
				);
			} ) }
		</RadioGroup>
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

export default contextConnect( SegmentControl, 'SegmentControl' );
