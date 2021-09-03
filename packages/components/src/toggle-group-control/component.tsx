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
	WordPressComponentProps,
} from '../ui/context';
import { View } from '../view';
import BaseControl from '../base-control';
import * as styles from './styles';
import { useUpdateEffect, useCx } from '../utils/hooks';
import Backdrop from './toggle-group-control-backdrop';
import type { ToggleGroupControlProps } from './types';
import ToggleGroupControlContext from './toggle-group-control-context';

const noop = () => {};

function ToggleGroupControl(
	props: WordPressComponentProps< ToggleGroupControlProps, 'input' >,
	forwardedRef: import('react').Ref< any >
) {
	const {
		className,
		isAdaptiveWidth = false,
		isBlock = false,
		label,
		hideLabelFromVision = false,
		help,
		onChange = noop,
		value,
		children,
		...otherProps
	} = useContextSystem( props, 'ToggleGroupControl' );
	const cx = useCx();
	const containerRef = useRef();
	const [ resizeListener, sizes ] = useResizeAware();
	const baseId = useInstanceId(
		ToggleGroupControl,
		'toggle-group-control'
	).toString();
	const radio = useRadioState( {
		baseId,
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
				styles.ToggleGroupControl,
				isBlock && styles.block,
				'medium',
				className
			),
		[ className, isBlock ]
	);
	return (
		<BaseControl help={ help }>
			<ToggleGroupControlContext.Provider
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
			</ToggleGroupControlContext.Provider>
		</BaseControl>
	);
}

export default contextConnect( ToggleGroupControl, 'ToggleGroupControl' );
