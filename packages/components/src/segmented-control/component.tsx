/**
 * External dependencies
 */
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
import { useUpdateEffect, useCx } from '../utils/hooks';
import Backdrop from './segmented-control-backdrop';
import type { SegmentedControlProps } from './types';
import SegmentedControlContext from './segmented-control-context';

const noop = () => {};

function SegmentedControl(
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
	const cx = useCx();
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
		<SegmentedControlContext.Provider
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
		</SegmentedControlContext.Provider>
	);
}

export default contextConnect( SegmentedControl, 'SegmentedControl' );
