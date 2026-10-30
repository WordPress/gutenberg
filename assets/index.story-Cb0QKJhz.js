import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{H as i,U as a,n as o,t as s}from"./DayPicker-DVepiyFW.js";import{_ as c,a as l,c as u,d,f,h as p,l as m,n as h,o as g,p as _,r as v,s as y,t as b,u as x,v as S,y as C}from"./shared-CQKSv8fK.js";var w,T;function init_calendar(){return(init_calendar=e((()=>{o(),n(),c(),d(),m(),y(),C(),w=t(),T=(0,r.forwardRef)(function UnforwardedCalendar({defaultValue:e,value:t,onValueChange:n,numberOfMonths:i=1,locale:a,timeZone:o,month:c,render:l,role:d=`application`,"aria-label":m,labels:h,...g},v){let{"aria-label":y,...b}=x({locale:a,timeZone:o,mode:`single`}),C=(0,r.useMemo)(()=>h?{...b.labels,...h}:b.labels,[b.labels,h]),T=(0,r.useCallback)((e,t,r,i)=>{n?.(e??null,t,r,i)},[n]),[E,D]=f({defaultValue:e,value:t,onChange:T}),O=u(v,c),k=(0,r.useMemo)(()=>({render:l,ref:O.ref,role:d,defaultAriaLabel:y}),[l,O.ref,d,y]);return(0,w.jsx)(S.Provider,{value:k,children:(0,w.jsx)(s,{...p,...b,...g,"aria-label":m,mode:`single`,month:c,numberOfMonths:_(i),labels:C,selected:E??void 0,onSelect:D,onDayFocus:O.onDayFocus,onDayBlur:O.onDayBlur})})});try{T.__docgenInfo={description:`\`Calendar\` provides a customizable calendar interface for **single date**
selection.

The component is built with accessibility in mind and follows ARIA best
practices for calendar widgets. It provides keyboard navigation, screen reader
support, and customizable labels for internationalization.`,displayName:`Calendar`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/calendar/calendar.tsx`,methods:[],props:{role:{defaultValue:{value:`application`},declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`BaseProps`}],description:`The ARIA role for the calendar's root element.

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
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`SingleProps`}],description:"The selected date (controlled). Use `null` when there is no selection.\nTo render an uncontrolled calendar, use `defaultValue` instead.",name:`value`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`SingleProps`},required:!1,tags:{},type:{name:`Date | null`}},onValueChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`SingleProps`}],description:`Event handler called when the selected date changes.`,name:`onValueChange`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`SingleProps`},required:!1,tags:{},type:{name:`OnValueChangeHandler<Date | null>`}},defaultValue:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`SingleProps`}],description:`The initially selected date (uncontrolled).`,name:`defaultValue`,parent:{fileName:`gutenberg/packages/ui/src/calendar/types.ts`,name:`SingleProps`},required:!1,tags:{},type:{name:`Date`}}},tags:{}}}catch{}})))()}var E,D,O,k,A,j,M,N;function init_index_story(){return(init_index_story=e((()=>{a(),n(),init_calendar(),l(),E=t(),{fn:D}=__STORYBOOK_MODULE_TEST__,O={tags:[`manifest`],title:`Components/@wordpress-ui/Calendar/Calendar`,id:`design-system-components-calendar-calendar`,component:T,parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}},render:({endMonth:e,...t})=>(0,E.jsx)(T,{...t,endMonth:g(e)}),argTypes:h,args:{onMonthChange:D(),onValueChange:D()}},k={},A={args:{disabled:b}},j={args:{defaultValue:v,defaultMonth:v}},M={args:{showOutsideDays:!0,fixedWeeks:!0}},N={render:function CalendarWithTimeZone({endMonth:e,...t}){let[n,a]=(0,r.useState)(null);return(0,r.useEffect)(()=>{a(new i(new Date().setDate(new Date().getDate()+7),t.timeZone))},[t.timeZone]),(0,E.jsxs)(E.Fragment,{children:[(0,E.jsx)(T,{...t,endMonth:g(e),value:n,onValueChange:(e,...n)=>{a(e?new i(e,t.timeZone):null),t.onValueChange?.(e,...n)},disabled:[{before:new i(new Date,t.timeZone)}]}),(0,E.jsxs)(`p`,{children:[`Calendar set to `,t.timeZone??`current`,` timezone, disabling selection for all dates before today, and starting with a default date of 1 week from today.`]})]})},args:{timeZone:`Pacific/Auckland`},argTypes:{value:{control:!1},defaultValue:{control:!1},disabled:{control:!1}}};try{M.__docgenInfo={description:"Shows days from adjacent months in the grid. Outside days use a lighter style\nand are still interactive. Use `fixedWeeks` to keep the grid height constant.",displayName:`WithOutsideDays`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/calendar/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{N.__docgenInfo={description:"When working with time zones, use the `TZDate` object from the\n[`@date-fns/tz`](https://www.npmjs.com/package/@date-fns/tz) package instead\nof the native `Date` object.",displayName:`WithTimeZone`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/calendar/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: DISABLED_DATES_SAMPLE
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: firstDayOfNextMonth,
    defaultMonth: firstDayOfNextMonth
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    showOutsideDays: true,
    fixedWeeks: true
  }
}`,...M.parameters?.docs?.source},description:{story:"Shows days from adjacent months in the grid. Outside days use a lighter style\nand are still interactive. Use `fixedWeeks` to keep the grid height constant.",...M.parameters?.docs?.description}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  render: function CalendarWithTimeZone({
    endMonth,
    ...args
  }) {
    const [selected, setSelected] = useState<TZDate | null>(null);
    useEffect(() => {
      setSelected(
      // Select one week from today every time the time zone changes.
      new TZDate(new Date().setDate(new Date().getDate() + 7), args.timeZone));
    }, [args.timeZone]);
    return <>
                <Calendar {...args} endMonth={toDate(endMonth)} value={selected} onValueChange={(selectedDate, ...rest) => {
        setSelected(selectedDate ? new TZDate(selectedDate, args.timeZone) : null);
        args.onValueChange?.(selectedDate, ...rest);
      }} disabled={[{
        // Disable any date before today
        before: new TZDate(new Date(), args.timeZone)
      }]} />

                <p>
                    Calendar set to {args.timeZone ?? 'current'} timezone,
                    disabling selection for all dates before today, and starting
                    with a default date of 1 week from today.
                </p>
            </>;
  },
  args: {
    timeZone: 'Pacific/Auckland'
  },
  argTypes: {
    value: {
      control: false
    },
    defaultValue: {
      control: false
    },
    disabled: {
      control: false
    }
  }
}`,...N.parameters?.docs?.source},description:{story:"When working with time zones, use the `TZDate` object from the\n[`@date-fns/tz`](https://www.npmjs.com/package/@date-fns/tz) package instead\nof the native `Date` object.",...N.parameters?.docs?.description}}}})))()}init_index_story();export{k as Default,A as DisabledDates,M as WithOutsideDays,j as WithSelectedDateAndMonth,N as WithTimeZone,O as default};