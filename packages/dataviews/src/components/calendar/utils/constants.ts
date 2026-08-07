/**
 * Internal dependencies
 */
import { Day } from './day-cell';

const CLASSNAMES = {
	root: 'dataviews-calendar',
	day: 'dataviews-calendar__day',
	day_button: 'dataviews-calendar__day-button',
	outside: 'dataviews-calendar__day--outside',
	caption_label: 'dataviews-calendar__caption-label',
	button_next: 'dataviews-calendar__button-next',
	button_previous: 'dataviews-calendar__button-previous',
	chevron: 'dataviews-calendar__chevron',
	nav: 'dataviews-calendar__nav',
	month_caption: 'dataviews-calendar__month-caption',
	months: 'dataviews-calendar__months',
	month_grid: 'dataviews-calendar__month-grid',
	weekday: 'dataviews-calendar__weekday',
	today: 'dataviews-calendar__day--today',
	selected: 'dataviews-calendar__day--selected',
	disabled: 'dataviews-calendar__day--disabled',
	hidden: 'dataviews-calendar__day--hidden',
	range_start: 'dataviews-calendar__range-start',
	range_end: 'dataviews-calendar__range-end',
	range_middle: 'dataviews-calendar__range-middle',
	weeks_before_enter: 'dataviews-calendar__weeks-before-enter',
	weeks_before_exit: 'dataviews-calendar__weeks-before-exit',
	weeks_after_enter: 'dataviews-calendar__weeks-after-enter',
	weeks_after_exit: 'dataviews-calendar__weeks-after-exit',
	caption_after_enter: 'dataviews-calendar__caption-after-enter',
	caption_after_exit: 'dataviews-calendar__caption-after-exit',
	caption_before_enter: 'dataviews-calendar__caption-before-enter',
	caption_before_exit: 'dataviews-calendar__caption-before-exit',
};
export const MODIFIER_CLASSNAMES = {
	preview: 'dataviews-calendar__day--preview',
	preview_start: 'dataviews-calendar__day--preview-start',
	preview_end: 'dataviews-calendar__day--preview-end',
};

export const COMMON_PROPS = {
	animate: true,
	// Only show days in the current month
	showOutsideDays: false,
	// Hide week number column
	showWeekNumber: false,
	// Show weekdays row
	hideWeekdays: false,
	// Month and year caption are not interactive
	captionLayout: 'label',
	// Show a variable number of weeks depending on the month
	fixedWeeks: false,
	// Show navigation buttons
	hideNavigation: false,
	// Class names
	classNames: CLASSNAMES,
	// Default role
	role: 'application',
	components: {
		Day,
	},
} as const;
