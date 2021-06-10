/**
 * External dependencies
 */
import { cx } from 'emotion';
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
import { contextConnect, useContextSystem } from '../ui/context';
import { View } from '../view';
import * as styles from './styles';
import { useUpdateEffect } from '../utils/hooks';
import Backdrop from './segmented-control-backdrop';
import Button from './segmented-control-button';

const noop = () => {};

/**
 * @param {import('./types').SegmentedControlProps} props
 * @param {import('react').Ref<any>}                forwardedRef
 */
function SegmentControl( props, forwardedRef ) {
	const {
		className,
		baseId,
		isAdaptiveWidth = false,
		isBlock = false,
		id,
		label,
		options = [],
		onChange = noop,
		size = 'medium',
		value,
		...otherProps
	} = useContextSystem( props, 'SegmentedControl' );

	const containerRef = useRef();
	const [ resizeListener, sizes ] = useResizeAware();

	const radio = useRadioState( {
		baseId: baseId || id,
		unstable_virtual: true,
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
				styles[ size ],
				className
			),
		[ className, size ]
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
