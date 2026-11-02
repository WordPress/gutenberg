import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,u as n}from"./blocks-Bi8bw4xb.js";import{t as r}from"./jsx-runtime-BxZPLZy3.js";import{i,r as a}from"./react-sPqhvIIV.js";function _createMdxContent(e){let t={a:`a`,code:`code`,h1:`h1`,h2:`h2`,h3:`h3`,p:`p`,pre:`pre`,strong:`strong`,...i(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(n,{id:`design-system-components-calendar-usage-guidelines`,title:`Components/@wordpress-ui/Calendar/Usage Guidelines`}),`
`,(0,o.jsx)(t.h1,{id:`calendar`,children:`Calendar`}),`
`,(0,o.jsxs)(t.p,{children:[(0,o.jsx)(t.code,{children:`Calendar`}),` selects a `,(0,o.jsx)(t.strong,{children:`single date`}),`. `,(0,o.jsx)(t.code,{children:`RangeCalendar`}),` selects a `,(0,o.jsx)(t.strong,{children:`date range`}),`. Both share the same prop surface apart from the shape of `,(0,o.jsx)(t.code,{children:`value`}),` / `,(0,o.jsx)(t.code,{children:`defaultValue`}),` / `,(0,o.jsx)(t.code,{children:`onValueChange`}),`, and the range-only `,(0,o.jsx)(t.code,{children:`min`}),`, `,(0,o.jsx)(t.code,{children:`max`}),`, `,(0,o.jsx)(t.code,{children:`excludeDisabled`}),`, and `,(0,o.jsx)(t.code,{children:`resetOnSelect`}),` props.`]}),`
`,(0,o.jsx)(t.p,{children:`Both are built for accessibility and follow ARIA best practices for calendar widgets: keyboard navigation, screen reader support, and customizable labels for internationalization.`}),`
`,(0,o.jsx)(t.h2,{id:`root-role`,children:`Root role`}),`
`,(0,o.jsxs)(t.p,{children:[(0,o.jsx)(t.code,{children:`Calendar`}),` and `,(0,o.jsx)(t.code,{children:`RangeCalendar`}),` use `,(0,o.jsx)(t.a,{href:`https://www.w3.org/TR/wai-aria-1.2/#application`,rel:`nofollow`,children:(0,o.jsx)(t.code,{children:`role="application"`})}),` by default to help screen readers pass navigation keys to the calendar. The accessible name includes the current month.`]}),`
`,(0,o.jsxs)(t.p,{children:[`Changing the role can affect screen-reader keyboard navigation. Only override it for a tested composition. Apply roles that require additional behavior, such as `,(0,o.jsx)(t.code,{children:`dialog`}),`, to a wrapper.`]}),`
`,(0,o.jsxs)(t.p,{children:[`When using `,(0,o.jsx)(t.code,{children:`application`}),`, include the current month in any custom `,(0,o.jsx)(t.code,{children:`aria-label`}),` or `,(0,o.jsx)(t.code,{children:`aria-labelledby`}),`.`]}),`
`,(0,o.jsx)(t.h2,{id:`usage`,children:`Usage`}),`
`,(0,o.jsx)(t.h3,{id:`uncontrolled-mode`,children:`Uncontrolled Mode`}),`
`,(0,o.jsxs)(t.p,{children:[`The component manages its own selection. Use `,(0,o.jsx)(t.code,{children:`defaultValue`}),` to set the initial value, and `,(0,o.jsx)(t.code,{children:`onValueChange`}),` to react to changes.`]}),`
`,(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{className:`language-jsx`,children:`import { Calendar } from '@wordpress/ui';

const MyUncontrolledCalendar = () => (
	<Calendar
		defaultValue={ new Date() }
		onValueChange={ ( date ) => console.log( 'Selected: ', date ) }
	/>
);
`})}),`
`,(0,o.jsx)(t.h3,{id:`controlled-mode`,children:`Controlled Mode`}),`
`,(0,o.jsxs)(t.p,{children:[`Pass `,(0,o.jsx)(t.code,{children:`value`}),` and update it from `,(0,o.jsx)(t.code,{children:`onValueChange`}),`. Pass `,(0,o.jsx)(t.code,{children:`null`}),` to represent no selection while staying controlled.`]}),`
`,(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{className:`language-jsx`,children:`import { useState } from 'react';
import { Calendar } from '@wordpress/ui';

const MyControlledCalendar = () => {
	const [ value, setValue ] = useState( new Date() );

	return <Calendar value={ value } onValueChange={ setValue } />;
};
`})}),`
`,(0,o.jsxs)(t.p,{children:[`The displayed month is a separate piece of state, controlled the same way through `,(0,o.jsx)(t.code,{children:`month`}),` / `,(0,o.jsx)(t.code,{children:`defaultMonth`}),` and `,(0,o.jsx)(t.code,{children:`onMonthChange`}),`.`]}),`
`,(0,o.jsx)(t.h3,{id:`range-selection`,children:`Range Selection`}),`
`,(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{className:`language-jsx`,children:`import { useState } from 'react';
import { RangeCalendar } from '@wordpress/ui';

const MyRangeCalendar = () => {
	const [ range, setRange ] = useState( null );

	return <RangeCalendar value={ range } onValueChange={ setRange } />;
};
`})}),`
`,(0,o.jsxs)(t.p,{children:[`Use `,(0,o.jsx)(t.code,{children:`min`}),` and `,(0,o.jsx)(t.code,{children:`max`}),` to constrain how many nights a range may span, and `,(0,o.jsx)(t.code,{children:`excludeDisabled`}),` to reset the range when a disabled day falls inside it.`]}),`
`,(0,o.jsxs)(t.p,{children:[`After a range is complete, selecting another date starts a new range, and the hover preview shows only that new start date. Set `,(0,o.jsx)(t.code,{children:`resetOnSelect`}),` to `,(0,o.jsx)(t.code,{children:`false`}),` to preview and adjust the closest end of the completed range instead.`]}),`
`,(0,o.jsx)(t.h2,{id:`disabling-days`,children:`Disabling Days`}),`
`,(0,o.jsxs)(t.p,{children:[`The `,(0,o.jsx)(t.code,{children:`disabled`}),` prop takes a matcher, or an array of matchers. Every shape below is supported:`]}),`
`,(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{className:`language-jsx`,children:`// Always matches — disables every day.
const booleanMatcher = true;

// Matches a specific day.
const dateMatcher = new Date();

// Matches any of the days in the array.
const arrayMatcher = [ new Date( 2019, 1, 2 ), new Date( 2019, 1, 4 ) ];

// Matches days after the 2nd of February 2019 (exclusive).
const afterMatcher = { after: new Date( 2019, 1, 2 ) };

// Matches days before the 2nd of February 2019 (exclusive).
const beforeMatcher = { before: new Date( 2019, 1, 2 ) };

// Matches the days between the 2nd and the 5th of February 2019 (exclusive).
const intervalMatcher = {
	after: new Date( 2019, 1, 2 ),
	before: new Date( 2019, 1, 5 ),
};

// Matches the days between the 2nd and the 5th of February 2019 (inclusive).
const rangeMatcher = {
	from: new Date( 2019, 1, 2 ),
	to: new Date( 2019, 1, 5 ),
};

// Matches Sundays; an array matches weekends.
const dayOfWeekMatcher = { dayOfWeek: 0 };
const weekendMatcher = { dayOfWeek: [ 0, 6 ] };

// Matches when the function returns true.
const functionMatcher = ( day ) => day.getMonth() === 2;
`})}),`
`,(0,o.jsx)(t.h2,{id:`localization`,children:`Localization`}),`
`,(0,o.jsxs)(t.p,{children:[(0,o.jsx)(t.code,{children:`Calendar`}),` and `,(0,o.jsx)(t.code,{children:`RangeCalendar`}),` always render a Gregorian date grid. A locale changes the language, localized names, numerals, and default text direction. It does not replace the underlying calendar system.`]}),`
`,(0,o.jsxs)(t.p,{children:[`Pass a BCP 47 locale code to `,(0,o.jsx)(t.code,{children:`locale`}),` to localize date text. This does not require importing a matching date-fns locale:`]}),`
`,(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{className:`language-jsx`,children:`import { Calendar } from '@wordpress/ui';

const MyFrenchCalendar = () => <Calendar locale="fr-FR" />;
`})}),`
`,(0,o.jsxs)(t.p,{children:[`The `,(0,o.jsx)(t.code,{children:`locale`}),` prop also accepts a locale object from `,(0,o.jsx)(t.a,{href:`https://github.com/date-fns/date-fns/tree/main/src/locale`,rel:`nofollow`,children:(0,o.jsx)(t.code,{children:`date-fns`})}),`:`]}),`
`,(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{className:`language-jsx`,children:`import { fr } from 'date-fns/locale';
import { Calendar } from '@wordpress/ui';

const MyFrenchCalendar = () => <Calendar locale={ fr } />;
`})}),`
`,(0,o.jsx)(t.p,{children:`For both input forms, an explicitly supplied, supported locale code derives the default text direction and first day of the week from the browser. This keeps the result consistent whether the code is passed directly or through a date-fns locale object.`}),`
`,(0,o.jsxs)(t.p,{children:[`When `,(0,o.jsx)(t.code,{children:`locale`}),` is omitted, invalid, or unsupported for date formatting, the default text direction follows the WordPress translation context. Date text independently falls back to `,(0,o.jsx)(t.code,{children:`en-US`}),`. A date-fns locale object with an unsupported code retains its own first-day setting.`]}),`
`,(0,o.jsxs)(t.p,{children:[`The visible strings (button labels, the "today" announcement) come from `,(0,o.jsx)(t.code,{children:`@wordpress/i18n`}),`, which uses the site locale rather than these props. For a coherent experience, make sure they agree — or override the strings through the `,(0,o.jsx)(t.code,{children:`labels`}),` prop.`]}),`
`,(0,o.jsxs)(t.p,{children:[`Use `,(0,o.jsx)(t.code,{children:`weekStartsOn`}),` to override the first day of the week, including to preserve a custom value from a date-fns locale object. An explicit `,(0,o.jsx)(t.code,{children:`dir`}),` prop overrides both the locale-derived and WordPress text direction. An explicit `,(0,o.jsx)(t.code,{children:`lang`}),` prop overrides the default language attribute.`]}),`
`,(0,o.jsx)(t.h2,{id:`time-zones`,children:`Time Zones`}),`
`,(0,o.jsxs)(t.p,{children:[`Set the `,(0,o.jsx)(t.code,{children:`timeZone`}),` prop to an `,(0,o.jsx)(t.a,{href:`https://en.wikipedia.org/wiki/List_of_tz_database_time_zones`,rel:`nofollow`,children:`IANA time zone name`}),` to render the calendar in a zone other than the browser's.`]}),`
`,(0,o.jsxs)(t.p,{children:[`When you do, pass `,(0,o.jsx)(t.code,{children:`TZDate`}),` objects rather than native `,(0,o.jsx)(t.code,{children:`Date`}),` objects, otherwise the value you hand in is interpreted in the browser's zone and the selection can land on the wrong day. `,(0,o.jsx)(t.code,{children:`TZDate`}),` comes from `,(0,o.jsx)(t.a,{href:`https://www.npmjs.com/package/@date-fns/tz`,rel:`nofollow`,children:(0,o.jsx)(t.code,{children:`@date-fns/tz`})}),`:`]}),`
`,(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{className:`language-jsx`,children:`import { TZDate } from '@date-fns/tz';
import { Calendar } from '@wordpress/ui';

const timeZone = 'America/New_York';

const MyCalendarWithTimeZone = () => (
	<Calendar
		timeZone={ timeZone }
		defaultValue={ new TZDate( 2024, 11, 10, timeZone ) }
	/>
);
`})})]})}function MDXContent(e={}){let{wrapper:t}={...i(),...e.components};return t?(0,o.jsx)(t,{...e,children:(0,o.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var o;function init_usage_guidelines(){return(init_usage_guidelines=e((()=>{o=r(),a(),t()})))()}init_usage_guidelines();export{MDXContent as default};