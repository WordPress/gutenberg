/**
 * External dependencies
 */
import { useLilius } from 'use-lilius';
import {
	format,
	isSameDay,
	startOfMonth,
	endOfMonth,
	subMonths,
	addMonths,
} from 'date-fns';

/**
 * WordPress dependencies
 */
import { __, _n } from '@wordpress/i18n';
import { arrowLeft, arrowRight } from '@wordpress/icons';
import { dateI18n } from '@wordpress/date';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DatePickerProps } from '../types';
import {
	Navigator,
	NavigatorHeading,
	Calendar,
	DayOfWeek,
	DayButton,
} from './styles';
import { inputToDate } from '../utils';
import Button from '../../button';

const TIMEZONELESS_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";
// const ARIAL_LABEL_TIME_FORMAT = 'dddd, LL';
// const noop = () => {};

// function DatePickerDay( { day, events = [] }: DatePickerDayProps ) {
// 	const ref = useRef< HTMLDivElement >( null );

// 	/*
// 	 * a11y hack to make the `There is/are n events` string
// 	 * available speaking for readers,
// 	 * re-defining the aria-label attribute.
// 	 * This attribute is handled by the react-dates component.
// 	 */
// 	useEffect( () => {
// 		// Bail when no parent node.
// 		if ( ! ( ref?.current?.parentNode instanceof Element ) ) {
// 			return;
// 		}

// 		const { parentNode } = ref.current;
// 		const dayAriaLabel = moment( day ).format( ARIAL_LABEL_TIME_FORMAT );

// 		if ( ! events.length ) {
// 			// Set aria-label without event description.
// 			parentNode.setAttribute( 'aria-label', dayAriaLabel );
// 			return;
// 		}

// 		const dayWithEventsDescription = sprintf(
// 			// translators: 1: Calendar day format, 2: Calendar event number.
// 			_n(
// 				'%1$s. There is %2$d event.',
// 				'%1$s. There are %2$d events.',
// 				events.length
// 			),
// 			dayAriaLabel,
// 			events.length
// 		);

// 		parentNode.setAttribute( 'aria-label', dayWithEventsDescription );
// 	}, [ day, events.length ] );

// 	return (
// 		<Day
// 			ref={ ref }
// 			className="components-datetime__date__day" // Unused, for backwards compatibility.
// 			hasEvents={ !! events?.length }
// 			alignment="center"
// 		>
// 			{ day.format( 'D' ) }
// 		</Day>
// 	);
// }

/**
 * DatePicker is a React component that renders a calendar for date selection.
 *
 * ```jsx
 * import { DatePicker } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyDatePicker = () => {
 *   const [ date, setDate ] = useState( new Date() );
 *
 *   return (
 *     <DatePicker
 *       currentDate={ date }
 *       onChange={ ( newDate ) => setDate( newDate ) }
 *     />
 *   );
 * };
 * ```
 */
export function DatePicker( {
	currentDate,
	onChange,
	events = [],
	isInvalidDate,
	onMonthPreviewed,
	startOfWeek = 0,
}: DatePickerProps ) {
	const date = currentDate ? inputToDate( currentDate ) : new Date();

	const {
		calendar,
		viewing,
		setSelected,
		setViewing,
		inRange,
		isSelected,
		viewPreviousMonth,
		viewNextMonth,
	} = useLilius( {
		selected: [ date ],
		viewing: date,
		weekStartsOn: startOfWeek,
	} );

	// Update the month being viewed when currentDate changes.
	const [ prevCurrentDate, setPrevCurrentDate ] = useState( currentDate );
	if ( currentDate !== prevCurrentDate ) {
		setPrevCurrentDate( currentDate );
		setViewing( date );
	}

	return (
		<div className="components-datetime__date">
			<Navigator>
				<Button
					icon={ arrowLeft }
					variant="tertiary"
					// TODO: aria-label
					onClick={ () => {
						viewPreviousMonth();
						onMonthPreviewed?.(
							format(
								subMonths( viewing, 1 ),
								TIMEZONELESS_FORMAT
							)
						);
					} }
				/>
				<NavigatorHeading level={ 3 }>
					<strong>{ dateI18n( 'F', viewing ) }</strong>{ ' ' }
					{ dateI18n( 'Y', viewing ) }
				</NavigatorHeading>
				<Button
					icon={ arrowRight }
					variant="tertiary"
					// TODO: aria-label
					onClick={ () => {
						viewNextMonth();
						onMonthPreviewed?.(
							format(
								addMonths( viewing, 1 ),
								TIMEZONELESS_FORMAT
							)
						);
					} }
				/>
			</Navigator>
			<Calendar>
				{ calendar[ 0 ][ 0 ].map( ( day ) => (
					<DayOfWeek key={ day.toString() }>
						{ /* TODO: why doesn't this work? */ }
						{ /* dateI18n( 'D', day ) */ }
						{
							[
								__( 'Sun' ),
								__( 'Mon' ),
								__( 'Tue' ),
								__( 'Wed' ),
								__( 'Thu' ),
								__( 'Fri' ),
								__( 'Sat' ),
							][ day.getDay() ]
						}
					</DayOfWeek>
				) ) }
				{ calendar[ 0 ].map( ( week ) =>
					week.map( ( day, index ) => {
						const isInRange = inRange(
							day,
							startOfMonth( viewing ),
							endOfMonth( viewing )
						);
						if ( ! isInRange ) {
							return null;
						}
						const numEvents = events.filter( ( event ) =>
							isSameDay( event.date, day )
						).length;
						return (
							<DayButton
								key={ day.toString() }
								className="components-datetime__date__day" // Unused, for backwards compatibility.
								disabled={
									isInvalidDate ? isInvalidDate( day ) : false
								}
								column={ index + 1 }
								isSelected={ isSelected( day ) }
								isToday={ isSameDay( day, new Date() ) }
								hasEvents={ numEvents > 0 }
								// TODO: aria-label
								onClick={ () => {
									setSelected( [ day ] );
									onChange?.(
										format( day, TIMEZONELESS_FORMAT )
									);
								} }
							>
								{ format( day, 'd' ) }
							</DayButton>
						);
					} )
				) }
			</Calendar>
		</div>
	);

	// const nodeRef = useRef< HTMLDivElement >( null );

	// const onMonthPreviewedHandler = ( newMonthDate: Moment ) => {
	// 	onMonthPreviewed?.( newMonthDate.toISOString() );
	// 	keepFocusInside();
	// };

	// /*
	//  * Todo: We should remove this function ASAP.
	//  * It is kept because focus is lost when we click on the previous and next month buttons.
	//  * This focus loss closes the date picker popover.
	//  * Ideally we should add an upstream commit on react-dates to fix this issue.
	//  */
	// const keepFocusInside = () => {
	// 	if ( ! nodeRef.current ) {
	// 		return;
	// 	}

	// 	const { ownerDocument } = nodeRef.current;
	// 	const { activeElement } = ownerDocument;

	// 	// If focus was lost.
	// 	if (
	// 		! activeElement ||
	// 		! nodeRef.current.contains( ownerDocument.activeElement )
	// 	) {
	// 		// Retrieve the focus region div.
	// 		const focusRegion = nodeRef.current.querySelector(
	// 			'.DayPicker_focusRegion'
	// 		);
	// 		if ( ! ( focusRegion instanceof HTMLElement ) ) {
	// 			return;
	// 		}
	// 		// Keep the focus on focus region.
	// 		focusRegion.focus();
	// 	}
	// };

	// const onChangeMoment = ( newDate: Moment | null ) => {
	// 	if ( ! newDate ) {
	// 		return;
	// 	}

	// 	// If currentDate is null, use now as momentTime to designate hours, minutes, seconds.
	// 	const momentDate = currentDate ? moment( currentDate ) : moment();
	// 	const momentTime = {
	// 		hours: momentDate.hours(),
	// 		minutes: momentDate.minutes(),
	// 		seconds: 0,
	// 	};

	// 	onChange?.( newDate.set( momentTime ).format( TIMEZONELESS_FORMAT ) );

	// 	// Keep focus on the date picker.
	// 	keepFocusInside();
	// };

	// const getEventsPerDay = ( day: Moment ) => {
	// 	if ( ! events?.length ) {
	// 		return [];
	// 	}

	// 	return events.filter( ( eventDay ) =>
	// 		day.isSame( eventDay.date, 'day' )
	// 	);
	// };

	// const momentDate = getMomentDate( currentDate );

	// return (
	// 	<div className="components-datetime__date" ref={ nodeRef }>
	// 		<DayPickerSingleDateController
	// 			date={ momentDate }
	// 			initialVisibleMonth={ null }
	// 			daySize={ 30 }
	// 			horizontalMonthPadding={ 0 }
	// 			focused
	// 			hideKeyboardShortcutsPanel
	// 			// This is a hack to force the calendar to update on month or year change
	// 			// https://github.com/airbnb/react-dates/issues/240#issuecomment-361776665
	// 			key={ `datepicker-controller-${
	// 				momentDate ? momentDate.format( 'MM-YYYY' ) : 'null'
	// 			}` }
	// 			noBorder
	// 			numberOfMonths={ 1 }
	// 			onDateChange={ onChangeMoment }
	// 			transitionDuration={ 0 }
	// 			weekDayFormat="ddd"
	// 			dayAriaLabelFormat={ ARIAL_LABEL_TIME_FORMAT }
	// 			isRTL={ isRTL() }
	// 			isOutsideRange={ ( date ) => {
	// 				return !! isInvalidDate && isInvalidDate( date.toDate() );
	// 			} }
	// 			firstDayOfWeek={ startOfWeek }
	// 			onPrevMonthClick={ onMonthPreviewedHandler }
	// 			onNextMonthClick={ onMonthPreviewedHandler }
	// 			renderDayContents={ ( day ) => (
	// 				<DatePickerDay
	// 					day={ day }
	// 					events={ getEventsPerDay( day ) }
	// 				/>
	// 			) }
	// 			renderMonthElement={ ( { month } ) => (
	// 				<>
	// 					<strong>{ month.format( 'MMMM' ) }</strong>{ ' ' }
	// 					{ month.format( 'YYYY' ) }
	// 				</>
	// 			) }
	// 			renderNavPrevButton={ ( { ariaLabel, ...props } ) => (
	// 				<NavPrevButton
	// 					icon={ arrowLeft }
	// 					variant="tertiary"
	// 					aria-label={ ariaLabel }
	// 					{ ...props }
	// 				/>
	// 			) }
	// 			renderNavNextButton={ ( { ariaLabel, ...props } ) => (
	// 				<NavNextButton
	// 					icon={ arrowRight }
	// 					variant="tertiary"
	// 					aria-label={ ariaLabel }
	// 					{ ...props }
	// 				/>
	// 			) }
	// 			onFocusChange={ noop }
	// 		/>
	// 	</div>
	// );
}

export default DatePicker;
