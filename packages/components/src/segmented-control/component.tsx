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
import { useMergeRefs, useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	PolymorphicComponentProps,
} from '../ui/context';
import { View } from '../view';
import BaseControl from '../base-control';
import * as styles from './styles';
import { useUpdateEffect, useCx } from '../utils/hooks';
import Backdrop from './segmented-control-backdrop';
import type { SegmentedControlProps } from './types';
import SegmentedControlContext from './segmented-control-context';

const noop = () => {};
function useUniqueId( idProp?: string ) {
	const instanceId = useInstanceId( SegmentedControl );
	const id = `inspector-select-control-${ instanceId }`;

	return idProp || id;
}

function SegmentedControl(
	props: PolymorphicComponentProps< SegmentedControlProps, 'input' >,
	forwardedRef: import('react').Ref< any >
) {
	const {
		className,
		baseId,
		isAdaptiveWidth = false,
		isBlock = false,
		id: idProp,
		label,
		hideLabelFromVision = false,
		help,
		onChange = noop,
		value,
		children,
		...otherProps
	} = useContextSystem( props, 'SegmentedControl' );
	const cx = useCx();
	const containerRef = useRef();
	const [ resizeListener, sizes ] = useResizeAware();

	const id = useUniqueId( idProp );
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
		[ className, isBlock ]
	);
	return (
		<BaseControl aria-label={ label } help={ help } id={ id }>
			<SegmentedControlContext.Provider
				value={ { ...radio, isBlock: ! isAdaptiveWidth } }
			>
				{ ! hideLabelFromVision && (
					<div>
						<BaseControl.VisualLabel>
							{ label }
						</BaseControl.VisualLabel>
					</div>
				) }
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
		</BaseControl>
	);
}

export default contextConnect( SegmentedControl, 'SegmentedControl' );
