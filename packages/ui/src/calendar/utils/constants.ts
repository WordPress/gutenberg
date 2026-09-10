import clsx from 'clsx';
import { Day, Root, PreviousMonthButton, NextMonthButton } from './components';
import styles from '../style.module.css';
import resetStyles from '../../utils/css/resets.module.css';
import focusStyles from '../../utils/css/focus.module.scss';
import defenseStyles from '../../utils/css/global-css-defense.module.css';

const CLASSNAMES = {
	root: clsx( styles.root, resetStyles[ 'box-sizing' ] ),
	day: styles.day,
	day_button: clsx(
		styles[ 'day-button' ],
		defenseStyles.button,
		focusStyles[ 'outset-ring--focus-visible' ]
	),
	outside: styles.outside,
	caption_label: styles[ 'caption-label' ],
	button_next: styles[ 'nav-button' ],
	button_previous: styles[ 'nav-button' ],
	nav: styles.nav,
	month_caption: styles[ 'month-caption' ],
	months: styles.months,
	month_grid: styles[ 'month-grid' ],
	weekday: styles.weekday,
	today: styles.today,
	selected: styles.selected,
	/*
	 * Disabled days are styled through `:has(.day-button:disabled)` rather than
	 * a modifier class on the cell, because the two are not equivalent: the
	 * focused day keeps its button enabled so it stays reachable. Mapped to
	 * `undefined` on purpose, so `@daypicker/react` doesn't fall back to its
	 * own `rdp-disabled` class for a modifier we don't style.
	 */
	disabled: undefined,
	hidden: styles.hidden,
	range_start: styles[ 'range-start' ],
	range_end: styles[ 'range-end' ],
	range_middle: styles[ 'range-middle' ],
	weeks_before_enter: styles[ 'weeks-before-enter' ],
	weeks_before_exit: styles[ 'weeks-before-exit' ],
	weeks_after_enter: styles[ 'weeks-after-enter' ],
	weeks_after_exit: styles[ 'weeks-after-exit' ],
	caption_after_enter: styles[ 'caption-after-enter' ],
	caption_after_exit: styles[ 'caption-after-exit' ],
	caption_before_enter: styles[ 'caption-before-enter' ],
	caption_before_exit: styles[ 'caption-before-exit' ],
};

/*
 * Only `preview` carries styles — the shape of the dashed preview border is
 * picked by the `Day` component from the `preview_start` / `preview_end`
 * modifiers themselves, not from a class.
 */
export const MODIFIER_CLASSNAMES = {
	preview: styles.preview,
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
	components: {
		Day,
		Root,
		PreviousMonthButton,
		NextMonthButton,
	},
} as const;
