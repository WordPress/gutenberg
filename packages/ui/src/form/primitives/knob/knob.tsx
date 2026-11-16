import { Slider } from '@base-ui/react/slider';
import clsx from 'clsx';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useRef, useState } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { DirectionProvider } from '../../../utils/direction-provider';
import resetStyles from '../../../utils/css/resets.module.css';
import {
	BOUNDED_SWEEP,
	constrainAngle,
	getPointerAngle,
	getStepChange,
	modulo,
} from './dial';
import type { KnobProps } from './types';
import styles from './style.module.scss';

type Drag = {
	pointerId: number;
	pointerAngle: number | null;
	dialAngle: number;
};

// The native range input occupies the whole dial for touch exploration.
// A linear Slider.Thumb would otherwise move from one side to the other.
const THUMB_STYLE = { insetInlineStart: 0, top: 0, translate: 'none' };

/**
 * A rotary slider for choosing a single number. Click or tap a position on the
 * dial, drag around its center, or use the arrow keys. Give it an accessible
 * name with Field.Label, aria-label, or aria-labelledby.
 */
export const Knob = forwardRef< HTMLDivElement, KnobProps >(
	function UnforwardedKnob(
		{
			min = 0,
			max = 100,
			step: stepProp = 1,
			largeStep = 10,
			wrap = false,
			value,
			defaultValue = min,
			onValueChange,
			inputRef,
			className,
			'aria-label': ariaLabel,
			'aria-labelledby': ariaLabelledBy,
			'aria-describedby': ariaDescribedBy,
			'aria-valuetext': ariaValueText,
			getAriaValueText,
			tabIndex,
			...props
		},
		ref
	) {
		const [ uncontrolledValue, setUncontrolledValue ] =
			useState( defaultValue );
		const input = useRef< HTMLInputElement >( null );
		const mergedInputRef = useMergeRefs( [ input, inputRef ] );
		const drag = useRef< Drag | null >( null );
		const step = Number.isFinite( stepProp ) && stepProp > 0 ? stepProp : 1;
		// Work in whole steps so that the last value on a wrapping dial has its
		// own position one step before the first value.
		const lastStep = Math.floor(
			Number( ( ( max - min ) / step ).toPrecision( 15 ) )
		);
		const toValue = ( index: number ) =>
			Number( ( min + index * step ).toPrecision( 15 ) );
		const toIndex = ( number: number ) =>
			Math.round( ( number - min ) / step );
		const index = Math.max(
			0,
			Math.min( lastStep, toIndex( value ?? uncontrolledValue ) )
		);
		const currentValue = toValue( index );
		const start = wrap ? 0 : -BOUNDED_SWEEP / 2;
		const sweep = wrap ? 360 : BOUNDED_SWEEP;
		const intervals = wrap ? lastStep + 1 : lastStep;
		const angle = start + ( intervals ? ( index / intervals ) * sweep : 0 );

		function changeIndex( next: number ) {
			const nextIndex = wrap
				? modulo( next, lastStep + 1 )
				: Math.max( 0, Math.min( lastStep, next ) );
			const nextValue = toValue( nextIndex );
			if ( nextValue === currentValue ) {
				return;
			}
			if ( value === undefined ) {
				setUncontrolledValue( nextValue );
			}
			onValueChange?.( nextValue );
		}

		function handlePointerDown(
			event: React.PointerEvent< HTMLDivElement >
		) {
			if (
				drag.current ||
				! event.isPrimary ||
				event.button !== 0 ||
				input.current?.disabled
			) {
				return;
			}
			const pointerAngle = getPointerAngle( event );
			drag.current = {
				pointerId: event.pointerId,
				pointerAngle,
				dialAngle:
					pointerAngle === null
						? angle
						: constrainAngle( pointerAngle, wrap ),
			};
			// Keep the browser's default mouse action from moving focus back to the dial wrapper.
			event.preventDefault();
			event.currentTarget.setPointerCapture( event.pointerId );
			input.current?.focus( { preventScroll: true } );
		}

		function updateFromPointer(
			event: React.PointerEvent< HTMLDivElement >
		) {
			const gesture = drag.current;
			if (
				! gesture ||
				gesture.pointerId !== event.pointerId ||
				input.current?.disabled
			) {
				return;
			}
			const pointerAngle = getPointerAngle( event );
			if ( pointerAngle === null ) {
				return;
			}
			// Follow the shortest movement across the seam. A bounded dial keeps
			// its end stop even when the pointer continues into the opposite half.
			let nextAngle = pointerAngle;
			if ( gesture.pointerAngle !== null ) {
				const delta = pointerAngle - gesture.pointerAngle;
				nextAngle =
					gesture.dialAngle + ( modulo( delta + 180, 360 ) - 180 );
			}
			gesture.dialAngle = constrainAngle( nextAngle, wrap );
			gesture.pointerAngle = pointerAngle;
			changeIndex(
				Math.round(
					( ( gesture.dialAngle - start ) / sweep ) * intervals
				)
			);
		}

		function handleKeyDown(
			event: React.KeyboardEvent< HTMLInputElement >
		) {
			if ( ! wrap || event.defaultPrevented ) {
				return;
			}
			const next = toIndex(
				currentValue + getStepChange( event, step, largeStep, isRTL() )
			);
			if ( next < 0 || next > lastStep ) {
				event.preventDefault();
				event.stopPropagation();
				changeIndex( next );
			}
		}

		return (
			<DirectionProvider>
				<Slider.Root< number >
					{ ...props }
					ref={ ref }
					className={ clsx(
						resetStyles[ 'box-sizing' ],
						styles.root,
						className
					) }
					min={ min }
					max={ lastStep > 0 ? toValue( lastStep ) : max }
					step={ step }
					largeStep={ largeStep }
					value={ currentValue }
					onValueChange={ ( next ) => changeIndex( toIndex( next ) ) }
				>
					<Slider.Thumb
						className={ styles.thumb }
						style={ THUMB_STYLE }
						inputRef={ mergedInputRef }
						aria-label={ ariaLabel }
						aria-labelledby={ ariaLabelledBy }
						aria-describedby={ ariaDescribedBy }
						aria-valuetext={ ariaValueText }
						getAriaValueText={ getAriaValueText }
						tabIndex={ tabIndex }
						onKeyDown={ handleKeyDown }
						onPointerDown={ handlePointerDown }
						onPointerMove={ updateFromPointer }
						onPointerUp={ updateFromPointer }
						onLostPointerCapture={ ( event ) => {
							if ( drag.current?.pointerId === event.pointerId ) {
								drag.current = null;
							}
						} }
					>
						<svg
							viewBox="0 0 48 48"
							aria-hidden="true"
							focusable="false"
						>
							<g
								transform={ `rotate(${ start - 90 } 24 24)` }
								fill="none"
							>
								<circle
									className={ styles.track }
									cx="24"
									cy="24"
									r="21"
									pathLength="360"
									strokeDasharray={ `${ sweep } 360` }
								/>
								{ wrap && (
									<path
										className={ styles.track }
										d="M45 24h-3"
									/>
								) }
								{ ! wrap && index > 0 && (
									<circle
										className={ styles.fill }
										cx="24"
										cy="24"
										r="21"
										pathLength="360"
										strokeDasharray={ `${ angle - start } 360` }
									/>
								) }
							</g>
							<circle
								className={ styles.face }
								cx="24"
								cy="24"
								r="16"
							/>
							<path
								className={ styles.pointer }
								d="M24 12v12"
								transform={ `rotate(${ angle } 24 24)` }
							/>
						</svg>
					</Slider.Thumb>
				</Slider.Root>
			</DirectionProvider>
		);
	}
);
