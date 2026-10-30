import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{F as i,H as a,I as o,U as s,i as c,n as l,r as u,t as d}from"./DayPicker-DVepiyFW.js";import{_ as f,a as p,c as m,d as h,f as g,g as _,h as v,i as y,l as b,n as x,o as S,p as C,r as w,s as T,t as E,u as D,v as O,y as k}from"./shared-CQKSv8fK.js";function usePreviewRange({value:e,hoveredDate:t,excludeDisabled:n,resetOnSelect:a,min:o,max:s,disabled:l}){return(0,r.useMemo)(()=>{if(!t||!e?.from)return;if(a&&e.to)return{from:t,to:t};let r,u;return t<e.from?(r={from:t,to:e.from},u={from:t,to:e.to??e.from}):e.to&&t>e.from&&t<e.to?(r={from:e.from,to:t},u={from:e.from,to:t}):t>e.from&&(r={from:e.to??e.from,to:t},u={from:e.from,to:t}),o!==void 0&&o>0&&u&&i(u.to,u.from)<o&&(r={from:t,to:t}),s!==void 0&&s>0&&u&&i(u.to,u.from)>s&&(r={from:t,to:t}),n&&l&&u&&c(u,l)&&(r={from:t,to:t}),r},[e,t,n,a,o,s,l])}var A,j;function init_range_calendar(){return(init_range_calendar=e((()=>{o(),l(),u(),n(),f(),h(),b(),T(),k(),A=t(),j=(0,r.forwardRef)(function UnforwardedRangeCalendar({defaultValue:e,value:t,onValueChange:n,numberOfMonths:i=1,excludeDisabled:a,resetOnSelect:o=!0,min:s,max:c,disabled:l,locale:u,timeZone:f,month:p,render:h,role:y=`application`,"aria-label":b,labels:x,...S},w){let{"aria-label":T,...E}=D({locale:u,timeZone:f,mode:`range`}),k=(0,r.useMemo)(()=>x?{...E.labels,...x}:E.labels,[E.labels,x]),j=(0,r.useCallback)((e,t,r,i)=>{n?.(e??null,t,r,i)},[n]),[M,N]=g({defaultValue:e,value:t,onChange:j}),P=m(w,p),[F,I]=(0,r.useState)(void 0),L=usePreviewRange({value:M,hoveredDate:F,excludeDisabled:a,resetOnSelect:o,min:s,max:c,disabled:l}),R=(0,r.useMemo)(()=>({preview:L,preview_start:L?.from,preview_end:L?.to}),[L]),z=(0,r.useMemo)(()=>({render:h,ref:P.ref,role:y,defaultAriaLabel:T}),[h,P.ref,y,T]);return(0,A.jsx)(O.Provider,{value:z,children:(0,A.jsx)(d,{...v,...E,...S,"aria-label":b,mode:`range`,month:p,numberOfMonths:C(i),disabled:l,excludeDisabled:a,resetOnSelect:o,min:s,max:c,labels:k,selected:M??void 0,onSelect:N,onDayFocus:P.onDayFocus,onDayBlur:P.onDayBlur,onDayMouseEnter:e=>I(e),onDayMouseLeave:()=>I(void 0),modifiers:R,modifiersClassNames:_})})});try{usePreviewRange.__docgenInfo={description:``,displayName:`usePreviewRange`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/calendar/range-calendar.tsx`,methods:[],props:{disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:"Specify which days are disabled. Using `true` will disable all dates.",name:`disabled`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`Matcher | Matcher[]`}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`}],description:"The selected range (controlled). Use `null` when there is no selection.\nTo render an uncontrolled calendar, use `defaultValue` instead.",name:`value`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`},required:!1,tags:{},type:{name:`DateRange | null`}},max:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`}],description:`The maximum number of nights to include in the range.`,name:`max`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`},required:!1,tags:{},type:{name:`number`}},min:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`}],description:`The minimum number of nights to include in the range.`,name:`min`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`},required:!1,tags:{},type:{name:`number`}},excludeDisabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`}],description:"When `true`, the range will reset when including a disabled day.",name:`excludeDisabled`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`},required:!1,tags:{},type:{name:`boolean`}},resetOnSelect:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`}],description:"When `true`, clicking a day starts a new range if there is no current start\ndate or if a range is already complete. In those cases, the clicked day\nbecomes the start of the new range. When `required` is `false`, clicking\nthe same day of a single-day range clears the selection.",name:`resetOnSelect`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`},required:!1,tags:{},type:{name:`boolean`}},hoveredDate:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/range-calendar.tsx`,name:`TypeLiteral`}],description:``,name:`hoveredDate`,required:!0,tags:{},type:{name:`Date | undefined`}}},tags:{}}}catch{}try{j.__docgenInfo={description:`\`RangeCalendar\` provides a customizable calendar interface for **date range**
selection.

The component is built with accessibility in mind and follows ARIA best
practices for calendar widgets. It provides keyboard navigation, screen reader
support, and customizable labels for internationalization.`,displayName:`RangeCalendar`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/calendar/range-calendar.tsx`,methods:[],props:{role:{defaultValue:{value:`application`},declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:`The ARIA role for the calendar's root element.

The default \`application\` role helps assistive technologies pass calendar
navigation keys to the component. Its accessible name includes the current
month.

Changing this role can affect screen-reader keyboard navigation. Only
override it for a tested composition. Apply roles that require additional
behavior, such as \`dialog\`, to a wrapper.`,name:`role`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`AriaRole`}},required:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:"Whether the selection is required.\nWhen `true`, there always needs to be a date selected.",name:`required`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`boolean`}},defaultMonth:{defaultValue:{value:`The current month`},declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:`The initial month to show in the calendar view (uncontrolled).`,name:`defaultMonth`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`Date`}},month:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:"The month displayed in the calendar view (controlled). Use together with\n`onMonthChange` to change the month programmatically.",name:`month`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`Date`}},numberOfMonths:{defaultValue:{value:`1`},declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:`The number of months displayed at once.`,name:`numberOfMonths`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`number`}},showOutsideDays:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:"When `true`, days from adjacent months are shown in the grid and receive\nthe `outside` modifier and the class.",name:`showOutsideDays`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`boolean`}},fixedWeeks:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:"When `true`, the calendar always shows a fixed number of weeks (e.g. 6)\nso the grid height does not change between months.",name:`fixedWeeks`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`boolean`}},startMonth:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:`The earliest month to start the month navigation.`,name:`startMonth`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`Date`}},endMonth:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:`The latest month to end the month navigation.`,name:`endMonth`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`Date`}},autoFocus:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:`Focus the first selected day (if set) or today's date (if not disabled).

Use this prop when the calendar should receive initial focus as it opens,
such as in a calendar popover. Do not use it to move focus after updates
to an open calendar.`,name:`autoFocus`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`boolean`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:"Specify which days are disabled. Using `true` will disable all dates.",name:`disabled`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`Matcher | Matcher[]`}},disableNavigation:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:`Disable the navigation buttons.`,name:`disableNavigation`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`boolean`}},labels:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:`Use custom labels, useful for translating the component.

For a correct localized experience, consumers should make sure the locale
used for translated labels and date text is consistent.`,name:`labels`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`{ labelNav?: (() => string); labelGrid?: ((date: Date) => string); labelGridcell?: ((date: Date, modifiers?: Modifiers | undefined) => string) | undefined; labelNext?: ((month: Date | undefined) => string) | undefined; labelPrevious?: ((month: Date | undefined) => string) | undefined; labelDa...`}},locale:{defaultValue:{value:"The `enUS` locale from `date-fns/locale`"},declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:`A BCP 47 locale code or date-fns locale object used to localize date text,
numerals, the default text direction, and the first day of the week.

The locale code derives the first day of the week when the browser provides
that information, whether passed directly or through a date-fns locale
object. Use \`weekStartsOn\` to override this default.

Invalid or unsupported locale codes fall back to \`en-US\` for date text.
A date-fns locale object with an unsupported code retains its own first-day
setting.

For a correct localized experience, consumers should make sure the locale
used for translated labels and date text is consistent.

The calendar always uses a Gregorian date grid. The locale does not change
the underlying calendar system.
@see https://github.com/date-fns/date-fns/tree/main/src/locale for a list of the supported locales`,name:`locale`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`string | Locale`}},weekStartsOn:{defaultValue:{value:"Based on the `locale` prop when available"},declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:`The index of the first day of the week (0 - Sunday). Overrides the locale's
one.`,name:`weekStartsOn`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`enum`,raw:`0 | 1 | 2 | 3 | 4 | 5 | 6`,value:[{value:`0`},{value:`1`},{value:`2`},{value:`3`},{value:`4`},{value:`5`},{value:`6`}]}},onMonthChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:`Event fired when the user navigates between months.`,name:`onMonthChange`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`((month: Date) => void)`}},timeZone:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:`The time zone (IANA or UTC offset) to use in the calendar.

See
[Wikipedia](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
for the possible values.

When working with time zones, use the \`TZDate\` object from the
[\`@date-fns/tz\`](https://www.npmjs.com/package/@date-fns/tz) package
instead of the native \`Date\` object.
@example   import { TZDate } from "@date-fns/tz";
  import { Calendar } from "@wordpress/ui";

  export function WithTimeZone() {
    const timeZone = "America/New_York";
    const [ value, setValue ] = useState< Date | null >(
      new TZDate( 2024, 12, 10, timeZone ) // Use \`TZDate\` instead of \`Date\`
    );
    return (
      <Calendar
        timeZone={ timeZone }
        value={ value }
        onValueChange={ setValue }
    />
  );
}`,name:`timeZone`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`string`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`Replaces the component's default HTML element using a given React
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},excludeDisabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`}],description:"When `true`, the range will reset when including a disabled day.",name:`excludeDisabled`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`},required:!1,tags:{},type:{name:`boolean`}},resetOnSelect:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`}],description:"When `true`, clicking a day starts a new range if there is no current start\ndate or if a range is already complete. In those cases, the clicked day\nbecomes the start of the new range. When `required` is `false`, clicking\nthe same day of a single-day range clears the selection.",name:`resetOnSelect`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`},required:!1,tags:{},type:{name:`boolean`}},min:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`}],description:`The minimum number of nights to include in the range.`,name:`min`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`},required:!1,tags:{},type:{name:`number`}},max:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`}],description:`The maximum number of nights to include in the range.`,name:`max`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`},required:!1,tags:{},type:{name:`number`}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`}],description:"The selected range (controlled). Use `null` when there is no selection.\nTo render an uncontrolled calendar, use `defaultValue` instead.",name:`value`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`},required:!1,tags:{},type:{name:`DateRange | null`}},onValueChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`}],description:`Event handler called when the selected range changes.`,name:`onValueChange`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`},required:!1,tags:{},type:{name:`OnValueChangeHandler<DateRange | null>`}},defaultValue:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`}],description:`The initially selected range (uncontrolled).`,name:`defaultValue`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`RangeProps`},required:!1,tags:{},type:{name:`DateRange`}}},tags:{}}}catch{}})))()}var M,N,P,F,I,L,R,z,B;function init_range_calendar_story(){return(init_range_calendar_story=e((()=>{s(),n(),init_range_calendar(),p(),M=t(),{fn:N}=__STORYBOOK_MODULE_TEST__,P={tags:[`manifest`],title:`Components/@wordpress-ui/Calendar/RangeCalendar`,id:`design-system-components-calendar-rangecalendar`,component:j,parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}},render:({endMonth:e,...t})=>(0,M.jsx)(j,{...t,endMonth:S(e)}),argTypes:{...x,value:{control:!1},defaultValue:{control:!1}},args:{onMonthChange:N(),onValueChange:N()}},F={},I={args:{disabled:E}},L={args:{defaultValue:{from:w,to:y},defaultMonth:w}},R={args:{min:2,max:7,excludeDisabled:!0,disabled:{dayOfWeek:[0,6]}}},z={args:{showOutsideDays:!0,fixedWeeks:!0}},B={render:function RangeCalendarWithTimeZone({endMonth:e,...t}){let[n,i]=(0,r.useState)(null);return(0,r.useEffect)(()=>{i({from:new a(new Date().setDate(new Date().getDate()+7),t.timeZone),to:new a(new Date().setDate(new Date().getDate()+14),t.timeZone)})},[t.timeZone]),(0,M.jsxs)(M.Fragment,{children:[(0,M.jsx)(j,{...t,endMonth:S(e),value:n,onValueChange:(e,...n)=>{i(!e||e.from===void 0&&e.to===void 0?null:e),t.onValueChange?.(e,...n)},disabled:[{before:new a(new Date,t.timeZone)}]}),(0,M.jsxs)(`p`,{children:[`Calendar set to `,t.timeZone??`current`,` timezone, disabling selection for all dates before today, and starting with a default date range of 1 week from today to 2 weeks from today.`]})]})},args:{timeZone:`Pacific/Auckland`},argTypes:{disabled:{control:!1}}};try{R.__docgenInfo={description:"Use `min` and `max` to constrain the number of nights the range may span, and\n`excludeDisabled` to reset the range when it would include a disabled day.",displayName:`WithRangeConstraints`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/calendar/stories/range-calendar.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{z.__docgenInfo={description:"Shows days from adjacent months in the grid. Outside days use a lighter style\nand are still interactive. Use `fixedWeeks` to keep the grid height constant.",displayName:`WithOutsideDays`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/calendar/stories/range-calendar.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{B.__docgenInfo={description:"When working with time zones, use the `TZDate` object from the\n[`@date-fns/tz`](https://www.npmjs.com/package/@date-fns/tz) package instead\nof the native `Date` object.",displayName:`WithTimeZone`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/calendar/stories/range-calendar.story.tsx`,methods:[],props:{},tags:{}}}catch{}F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: DISABLED_DATES_SAMPLE
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: {
      from: firstDayOfNextMonth,
      to: fourthDayOfNextMonth
    },
    defaultMonth: firstDayOfNextMonth
  }
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  args: {
    min: 2,
    max: 7,
    excludeDisabled: true,
    disabled: {
      dayOfWeek: [0, 6]
    }
  }
}`,...R.parameters?.docs?.source},description:{story:"Use `min` and `max` to constrain the number of nights the range may span, and\n`excludeDisabled` to reset the range when it would include a disabled day.",...R.parameters?.docs?.description}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  args: {
    showOutsideDays: true,
    fixedWeeks: true
  }
}`,...z.parameters?.docs?.source},description:{story:"Shows days from adjacent months in the grid. Outside days use a lighter style\nand are still interactive. Use `fixedWeeks` to keep the grid height constant.",...z.parameters?.docs?.description}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  render: function RangeCalendarWithTimeZone({
    endMonth,
    ...args
  }) {
    const [range, setRange] = useState<typeof args.value>(null);
    useEffect(() => {
      setRange(
      // Select from one week from today to two weeks from today
      // every time the timezone changes.
      {
        from: new TZDate(new Date().setDate(new Date().getDate() + 7), args.timeZone),
        to: new TZDate(new Date().setDate(new Date().getDate() + 14), args.timeZone)
      });
    }, [args.timeZone]);
    return <>
                <RangeCalendar {...args} endMonth={toDate(endMonth)} value={range} onValueChange={(selectedDate, ...rest) => {
        setRange(
        // Set controlled state to null if there's no selection
        !selectedDate || selectedDate.from === undefined && selectedDate.to === undefined ? null : selectedDate);
        args.onValueChange?.(selectedDate, ...rest);
      }} disabled={[{
        // Disable any date before today
        before: new TZDate(new Date(), args.timeZone)
      }]} />
                <p>
                    Calendar set to {args.timeZone ?? 'current'} timezone,
                    disabling selection for all dates before today, and starting
                    with a default date range of 1 week from today to 2 weeks
                    from today.
                </p>
            </>;
  },
  args: {
    timeZone: 'Pacific/Auckland'
  },
  argTypes: {
    disabled: {
      control: false
    }
  }
}`,...B.parameters?.docs?.source},description:{story:"When working with time zones, use the `TZDate` object from the\n[`@date-fns/tz`](https://www.npmjs.com/package/@date-fns/tz) package instead\nof the native `Date` object.",...B.parameters?.docs?.description}}}})))()}init_range_calendar_story();export{F as Default,I as DisabledDates,z as WithOutsideDays,R as WithRangeConstraints,L as WithSelectedRangeAndMonth,B as WithTimeZone,P as default};