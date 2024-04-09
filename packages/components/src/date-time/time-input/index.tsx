/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Fieldset,
	TimeWrapper,
	TimeSeparator,
	HoursInput,
	MinutesInput,
} from '../time/styles';
import { HStack } from '../../h-stack';
import Button from '../../button';
import ButtonGroup from '../../button-group';
import BaseControl from '../../base-control';
import {
	buildPadInputStateReducer,
	from12hTo24h,
	from24hTo12h,
	validateInputElementTarget,
} from '../utils';
import type { TimeInputProps } from '../types';
import type { InputChangeCallback } from '../../input-control/types';

export function TimeInput( {
	is12Hour,
	hours: initHours = new Date().getHours(),
	minutes: initMinutes = new Date().getMinutes(),
	minutesStep = 1,
	onChange,
}: TimeInputProps ) {
	const _initDayPeriod = initHours < 12 ? 'AM' : 'PM';
	const _initHours = is12Hour
		? from24hTo12h( initHours )
		: from12hTo24h( initHours, _initDayPeriod === 'PM' );

	const [ hours, setHours ] = useState( _initHours );
	const [ minutes, setMinutes ] = useState( initMinutes );
	const [ dayPeriod, setDayPeriod ] = useState( _initDayPeriod );

	const buildNumberControlChangeCallback = (
		method: 'hours' | 'minutes'
	) => {
		const callback: InputChangeCallback = ( value, { event } ) => {
			if ( ! validateInputElementTarget( event ) ) {
				return;
			}

			// We can safely assume value is a number if target is valid.
			const numberValue = Number( value );

			switch ( method ) {
				case 'hours':
					setHours( numberValue );
					break;
				case 'minutes':
					setMinutes( numberValue );
					break;
			}
		};

		return callback;
	};

	const buildAmPmChangeCallback = ( value: 'AM' | 'PM' ) => {
		return () => {
			if ( dayPeriod === value ) {
				return;
			}

			setDayPeriod( value );
		};
	};

	useEffect( () => {
		onChange?.( { hours, minutes } );
	}, [ onChange, hours, minutes ] );

	useEffect( () => {
		setHours(
			is12Hour
				? from24hTo12h( hours )
				: from12hTo24h( hours, dayPeriod === 'PM' )
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ is12Hour ] );

	return (
		<Fieldset>
			<BaseControl.VisualLabel
				as="legend"
				className="components-datetime__time-legend" // Unused, for backwards compatibility.
			>
				{ __( 'Time' ) }
			</BaseControl.VisualLabel>
			<HStack
				className="components-datetime__time-wrapper" // Unused, for backwards compatibility.
				alignment="left"
			>
				<TimeWrapper
					className="components-datetime__time-field components-datetime__time-field-time" // Unused, for backwards compatibility.
				>
					<HoursInput
						className="components-datetime__time-field-hours-input" // Unused, for backwards compatibility.
						label={ __( 'Hours' ) }
						hideLabelFromVision
						__next40pxDefaultSize
						value={ hours }
						step={ 1 }
						min={ is12Hour ? 1 : 0 }
						max={ is12Hour ? 12 : 23 }
						required
						spinControls="none"
						isPressEnterToChange
						isDragEnabled={ false }
						isShiftStepEnabled={ false }
						onChange={ buildNumberControlChangeCallback( 'hours' ) }
						__unstableStateReducer={ buildPadInputStateReducer(
							2
						) }
					/>
					<TimeSeparator
						className="components-datetime__time-separator" // Unused, for backwards compatibility.
						aria-hidden="true"
					>
						:
					</TimeSeparator>
					<MinutesInput
						className="components-datetime__time-field-minutes-input" // Unused, for backwards compatibility.
						label={ __( 'Minutes' ) }
						hideLabelFromVision
						__next40pxDefaultSize
						value={ minutes }
						step={ minutesStep }
						min={ 0 }
						max={ 59 }
						required
						spinControls="none"
						isPressEnterToChange
						isDragEnabled={ false }
						isShiftStepEnabled={ false }
						onChange={ buildNumberControlChangeCallback(
							'minutes'
						) }
						__unstableStateReducer={ buildPadInputStateReducer(
							2
						) }
					/>
				</TimeWrapper>
				{ is12Hour && (
					<ButtonGroup
						className="components-datetime__time-field components-datetime__time-field-am-pm" // Unused, for backwards compatibility.
					>
						<Button
							className="components-datetime__time-am-button" // Unused, for backwards compatibility.
							variant={
								dayPeriod === 'AM' ? 'primary' : 'secondary'
							}
							__next40pxDefaultSize
							onClick={ buildAmPmChangeCallback( 'AM' ) }
						>
							{ __( 'AM' ) }
						</Button>
						<Button
							className="components-datetime__time-pm-button" // Unused, for backwards compatibility.
							variant={
								dayPeriod === 'PM' ? 'primary' : 'secondary'
							}
							__next40pxDefaultSize
							onClick={ buildAmPmChangeCallback( 'PM' ) }
						>
							{ __( 'PM' ) }
						</Button>
					</ButtonGroup>
				) }
			</HStack>
		</Fieldset>
	);
}
export default TimeInput;
