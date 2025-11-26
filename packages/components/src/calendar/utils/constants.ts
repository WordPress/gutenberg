/**
 * Internal dependencies
 */
import { Day } from './day-cell';

const CLASSNAMES = {
	root: 'components-calendar',
	day: 'components-calendar__day',
	day_button: 'components-calendar__day-button',
	caption_label: 'components-calendar__caption-label',
	button_next: 'components-calendar__button-next',
	button_previous: 'components-calendar__button-previous',
	chevron: 'components-calendar__chevron',
	nav: 'components-calendar__nav',
	month_caption: 'components-calendar__month-caption',
	months: 'components-calendar__months',
	month_grid: 'components-calendar__month-grid',
	weekday: 'components-calendar__weekday',
	today: 'components-calendar__day--today',
	selected: 'components-calendar__day--selected',
	disabled: 'components-calendar__day--disabled',
	hidden: 'components-calendar__day--hidden',
	range_start: 'components-calendar__range-start',
	range_end: 'components-calendar__range-end',
	range_middle: 'components-calendar__range-middle',
	weeks_before_enter: 'components-calendar__weeks-before-enter',
	weeks_before_exit: 'components-calendar__weeks-before-exit',
	weeks_after_enter: 'components-calendar__weeks-after-enter',
	weeks_after_exit: 'components-calendar__weeks-after-exit',
	caption_after_enter: 'components-calendar__caption-after-enter',
	caption_after_exit: 'components-calendar__caption-after-exit',
	caption_before_enter: 'components-calendar__caption-before-enter',
	caption_before_exit: 'components-calendar__caption-before-exit',
};
export const MODIFIER_CLASSNAMES = {
	preview: 'components-calendar__day--preview',
	preview_start: 'components-calendar__day--preview-start',
	preview_end: 'components-calendar__day--preview-end',
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
