import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./icon-BGlJFHC6.js";import{Pt as o,n as s}from"./build-module-DttIWYbV.js";import{n as c,t as l}from"./stack-yNRxuGKo.js";import{n as u,t as d}from"./dataform-Dw4PbK6V.js";import{n as f,t as p}from"./filter-sort-and-paginate-KpigQiyz.js";import{n as m,t as h}from"./dataviews-BjmDUbIY.js";function generateAdditionalElements(e,t){let n=[];for(let r=1;r<=e;r++)n.push({value:`${t}${r+3}`,label:`${t.charAt(0).toUpperCase()+t.slice(1)} ${r+3}`});return n}var g,_,StarIconPrefix,v,y,FieldTypeStory,AllComponent,TextComponent,IntegerComponent,NumberComponent,BooleanComponent,DateTimeComponent,DateComponent,TimeComponent,EmailComponent,TelephoneComponent,UrlComponent,ColorComponent,MediaComponent,ArrayComponent,PasswordComponent,NoTypeComponent;function init_index_story(){return(init_index_story=e((()=>{n(),i(),c(),s(),m(),u(),f(),g=t(),_={parameters:{a11y:{test:`todo`}},id:`dataviews-fieldtypes`,title:`Design System/DataViews/FieldTypes`,component:d,argTypes:{type:{control:{type:`select`},description:`Chooses the default layout of each field. "regular" is the default layout.`,options:[`regular`,`panel`]},Edit:{control:{type:`select`},description:`Chooses the Edit function for the field. "Default" means use the default Edit function for the field type.`,options:[`default`,`adaptiveSelect`,`array`,`checkbox`,`color`,`combobox`,`date`,`datetime`,`email`,`integer`,`number`,`password`,`radio`,`select`,`telephone`,`url`,`text`,`time`,`toggle`,`toggleGroup`]},asyncElements:{control:{type:`boolean`},description:`Whether the filter should fetch elements asynchronously.`,options:[!0,!1]},manyElements:{control:{type:`boolean`},description:`Add 10 more elements to push over the threshold and trigger Combobox rendering`,if:{arg:`Edit`,eq:`adaptiveSelect`}},disabled:{control:{type:`boolean`},description:`Whether the field controls are disabled.`}},args:{type:`regular`,Edit:`default`,asyncElements:!1,manyElements:!1,disabled:!1}},StarIconPrefix=()=>(0,g.jsx)(a,{icon:o}),v=[{id:1,text:`Text`,textWithElements:`item1`,textWithRadio:`item2`,textWithTextarea:`Textarea`,integer:1,integerWithElements:1,number:10.25,numberWithElements:2,boolean:!0,booleanWithToggle:!0,booleanWithElements:!0,datetime:`2021-01-01T14:30:00Z`,datetimeCompact:`2021-01-01T14:30:00Z`,datetimeWithElements:`1982-05-10T20:30:00Z`,date:`2021-01-01`,dateWithElements:`2021-01-01`,time:`14:30`,timeWithSeconds:`14:30:45`,timeWithElements:`13:00`,email:`hi@example.com`,emailWithElements:`bob@example.com`,telephone:`+1-555-123-4567`,telephoneWithElements:`+1-555-123-4567`,color:`#ff6600`,colorWithElements:`rgba(255, 165, 0, 0.8)`,url:`https://example.com`,urlWithElements:`https://example.com`,password:`secretpassword123`,passwordWithElements:`secretpassword123`,media:`https://live.staticflickr.com/7398/9458193857_e1256123e3_z.jpg`,mediaWithElements:`https://live.staticflickr.com/7398/9458193857_e1256123e3_z.jpg`,array:[`item1`,`item2`,`item3`],arrayWithElements:[`item1`,`item2`,`item3`],notype:`No type`,notypeWithElements:`No type`,priceWithPrefix:`25.99`,ratingWithIcon:`4.5`,percentageWithSuffix:`85`,priceWithBoth:`199.99`}],y=[{id:`text`,type:`text`,label:`Text`,description:`Help for text.`},{id:`textWithElements`,type:`text`,label:`Text (with elements)`,description:`Help for text with elements.`,elements:[{value:`item1`,label:`Item 1`},{value:`item2`,label:`Item 2`},{value:`item3`,label:`Item 3`}]},{id:`textWithRadio`,type:`text`,label:`Text (with radio)`,description:`Help for text with radio.`,Edit:`radio`,elements:[{value:`item1`,label:`Item 1`},{value:`item2`,label:`Item 2`},{value:`item3`,label:`Item 3`}]},{id:`textWithTextarea`,type:`text`,label:`Textarea`,description:`Help for textarea.`,Edit:`textarea`},{id:`integer`,type:`integer`,label:`Integer`,description:`Help for integer.`},{id:`integerWithElements`,type:`integer`,label:`Integer (with elements)`,description:`Help for integer with elements.`,elements:[{value:1,label:`One`},{value:2,label:`Two`},{value:3,label:`Three`}],setValue:({value:e})=>({integerWithElements:parseInt(e,10)})},{id:`number`,type:`number`,label:`Number`,description:`Number field increments by 0.01.`},{id:`numberWithElements`,type:`number`,label:`Number (with elements)`,description:`Number field with elements.`,elements:[{value:1,label:`One`},{value:2,label:`Two`},{value:3,label:`Three`}],setValue:({value:e})=>({numberWithElements:Number(e)})},{id:`boolean`,type:`boolean`,label:`Boolean`,description:`Help for boolean.`},{id:`booleanWithToggle`,type:`boolean`,label:`Boolean (with toggle)`,description:`Help for boolean with toggle control.`,Edit:`toggle`},{id:`booleanWithElements`,type:`boolean`,label:`Boolean (with elements)`,description:`Help for boolean with elements.`,elements:[{value:!0,label:`It is true`},{value:!1,label:`It is false`}],setValue:({value:e})=>({booleanWithElements:e===`true`})},{id:`datetime`,type:`datetime`,label:`Datetime`,description:`Help for datetime.`},{id:`datetimeCompact`,type:`datetime`,label:`Datetime (compact)`,description:`Datetime field without the calendar widget.`,Edit:{control:`datetime`,compact:!0}},{id:`datetimeWithElements`,type:`datetime`,label:`Datetime (with elements)`,description:`Help for datetime with elements.`,elements:[{value:`1973-02-01T14:30:00Z`,label:`February 1st, 1973. 14:30UTC`},{value:`1982-05-10T20:30:00Z`,label:`May 10th, 1982. 20:30UTC`},{value:`1994-03-01T14:30:00Z`,label:`March 1st, 1994. 14:30UTC`}]},{id:`date`,type:`date`,label:`Date`,description:`Help for date.`},{id:`dateWithElements`,type:`date`,label:`Date (with elements)`,description:`Help for date with elements.`,elements:[{value:`2021-01-01`,label:`January 1st, 2021`},{value:`2021-02-01`,label:`February 1st, 2021`},{value:`2021-03-01`,label:`March 1st, 2021`}]},{id:`time`,type:`time`,label:`Time`,description:`Help for time.`},{id:`timeWithSeconds`,type:`time`,label:`Time (with seconds)`,description:`A format that renders seconds also gives the control a seconds field.`,format:{time:`H:i:s`}},{id:`timeWithElements`,type:`time`,label:`Time (with elements)`,description:`Help for time with elements.`,elements:[{value:`09:00`,label:`Morning`},{value:`13:00`,label:`Afternoon`},{value:`19:00`,label:`Evening`}]},{id:`email`,type:`email`,label:`Email`,description:`Help for email.`},{id:`emailWithElements`,type:`email`,label:`Email (with elements)`,description:`Help for email with elements.`,elements:[{value:`john@example.com`,label:`John Doe`},{value:`jane@example.com`,label:`Jane Doe`},{value:`bob@example.com`,label:`Bob Smith`}],setValue:({value:e})=>({emailWithElements:e})},{id:`telephone`,type:`telephone`,label:`Telephone`,description:`Help for telephone.`},{id:`telephoneWithElements`,type:`telephone`,label:`Telephone (with elements)`,description:`Help for telephone with elements.`,elements:[{value:`+1-555-123-4567`,label:`+1-555-123-4567`},{value:`+44-20-7946-0958`,label:`+44-20-7946-0958`},{value:`+81-3-1234-5678`,label:`+81-3-1234-5678`}]},{id:`url`,type:`url`,label:`URL`,description:`Help for URL.`},{id:`urlWithElements`,type:`url`,label:`URL (with elements)`,description:`Help for URL with elements.`,elements:[{value:`https://example.com`,label:`https://example.com`},{value:`https://wordpress.org`,label:`https://wordpress.org`},{value:`https://github.com`,label:`https://github.com`}]},{id:`color`,type:`color`,label:`Color`,description:`Help for color. Supports hex, rgb, hsl formats with alpha channel.`},{id:`colorWithElements`,type:`color`,label:`Color (with elements)`,description:`Help for color with predefined color options.`,elements:[{value:`#ff0000`,label:`Red`},{value:`#00ff00`,label:`Green`},{value:`#0000ff`,label:`Blue`},{value:`rgba(255, 165, 0, 0.8)`,label:`Orange (80% opacity)`},{value:`hsl(300, 100%, 50%)`,label:`Magenta`},{value:`hsla(120, 100%, 25%, 0.6)`,label:`Dark Green (60% opacity)`}]},{id:`password`,type:`password`,label:`Password`,description:`Help for password.`},{id:`passwordWithElements`,type:`password`,label:`Password (with elements)`,description:`Help for password with elements.`,elements:[{value:`secretpassword123`,label:`Secret Password`},{value:`adminpass456`,label:`Admin Password`},{value:`userpass789`,label:`User Password`}]},{id:`media`,type:`media`,label:`Media`,description:`Help for media.`,render:({item:e})=>(0,g.jsx)(`img`,{src:e.media,alt:``,style:{width:`100%`}})},{id:`mediaWithElements`,type:`media`,label:`Media (with elements)`,description:`Help for media with elements.`,elements:[{value:`https://live.staticflickr.com/7398/9458193857_e1256123e3_z.jpg`,label:`Moon`},{value:`https://live.staticflickr.com/8151/7651156426_e047f4d219_z.jpg`,label:`Mars`},{value:`https://live.staticflickr.com/3762/9460163562_964fe6af07_z.jpg`,label:`Earth`}],render:({item:e})=>(0,g.jsx)(`img`,{src:e.mediaWithElements,alt:``,style:{width:`100%`}})},{id:`array`,type:`array`,label:`Array`,description:`Help for array.`},{id:`arrayWithElements`,type:`array`,label:`Array (with elements)`,description:`Help for array with elements.`,elements:[{value:`item1`,label:`Item 1`},{value:`item2`,label:`Item 2`},{value:`item3`,label:`Item 3`}]},{id:`notype`,label:`No type`,description:`Help for notype.`},{id:`notypeWithElements`,label:`No type (with elements)`,description:`Help for notype with elements.`,elements:[{value:`item1`,label:`Item 1`},{value:`item2`,label:`Item 2`},{value:`item3`,label:`Item 3`}]},{id:`priceWithPrefix`,label:`Text with Prefix`,type:`text`,description:`Text field with dollar sign prefix.`,Edit:{control:`text`,prefix:`$`}},{id:`ratingWithIcon`,label:`Text with Icon Prefix`,type:`text`,description:`Text field with star icon prefix.`,Edit:{control:`text`,prefix:StarIconPrefix,prefixPadding:`minimal`}},{id:`percentageWithSuffix`,label:`Text with Suffix`,type:`text`,description:`Text field with percent sign suffix.`,Edit:{control:`text`,suffix:`%`}},{id:`priceWithBoth`,label:`Text with Prefix and Suffix`,type:`text`,description:`Text field with both dollar prefix and USD suffix.`,Edit:{control:`text`,prefix:`$`,suffix:`USD`}}],FieldTypeStory=({fields:e,type:t,Edit:n,asyncElements:i,manyElements:a,disabled:o})=>{let s=(0,r.useMemo)(()=>{let t=e;return o&&(t=t.map(e=>({...e,isDisabled:!0}))),n!=="default"&&(t=t.map(e=>({...e,Edit:n}))),n===`adaptiveSelect`&&a&&(t=t.map(e=>{if(e.elements&&Array.isArray(e.elements)){let t=generateAdditionalElements(10,e.id.replace(`WithElements`,``));return{...e,elements:[...e.elements,...t]}}return e})),i&&(t=t.map(e=>{if(e.elements){let t=e.elements;return{...e,elements:void 0,getElements:()=>new Promise(e=>setTimeout(()=>e(t),500))}}return e})),t},[e,n,i,a,o]),c=(0,r.useMemo)(()=>({layout:{type:t},fields:s.map(e=>e.id)}),[t,s]),[u,f]=(0,r.useState)({type:`table`,search:``,page:1,perPage:10,layout:{},filters:[],fields:s.map(e=>e.id)}),[m,_]=(0,r.useState)([]),[y,b]=(0,r.useState)(v),{data:x,paginationInfo:S}=(0,r.useMemo)(()=>p(y,u,s),[y,u,s]),C=m.length===1&&x.find(e=>e.id===m[0])||null;return(0,g.jsxs)(l,{direction:`row`,gap:`sm`,align:`stretch`,children:[(0,g.jsx)(`div`,{style:{flex:2},children:(0,g.jsx)(h,{getItemId:e=>e.id.toString(),data:x,paginationInfo:S,view:u,fields:s,onChangeView:f,actions:[{id:`edit`,label:`Edit`,callback:()=>{},disabled:!0,supportsBulk:!0}],defaultLayouts:{table:!0},selection:m.map(e=>e.toString()),onChangeSelection:e=>_(e.map(e=>parseInt(e,10)))})}),C?(0,g.jsx)(l,{direction:`column`,gap:`sm`,align:`top`,children:(0,g.jsx)(d,{data:C,form:c,fields:s,onChange:e=>{let t={...C,...e};b(y.map(e=>e.id===C.id?t:e))}})}):(0,g.jsx)(l,{direction:`column`,gap:`sm`,align:`center`,justify:`center`,children:(0,g.jsx)(`span`,{style:{color:`#888`},children:`Please, select a single item.`})})]})},AllComponent=({type:e,Edit:t,asyncElements:n,manyElements:r,disabled:i})=>(0,g.jsx)(FieldTypeStory,{fields:y,type:e,Edit:t,asyncElements:n,manyElements:r,disabled:i}),AllComponent.storyName=`All types`,TextComponent=({type:e,Edit:t,asyncElements:n,manyElements:i,disabled:a})=>{let o=(0,r.useMemo)(()=>y.filter(e=>e.type===`text`),[]);return(0,g.jsx)(FieldTypeStory,{fields:o,type:e,Edit:t,asyncElements:n,manyElements:i,disabled:a})},TextComponent.storyName=`text`,IntegerComponent=({type:e,Edit:t,asyncElements:n,manyElements:i,formatSeparatorThousand:a,disabled:o})=>{let s=(0,r.useMemo)(()=>y.filter(e=>e.type===`integer`).map(e=>a===void 0?e:{...e,format:{separatorThousand:a}}),[a]);return(0,g.jsx)(FieldTypeStory,{fields:s,type:e,Edit:t,asyncElements:n,manyElements:i,disabled:o})},IntegerComponent.storyName=`integer`,IntegerComponent.args={formatSeparatorThousand:`,`},IntegerComponent.argTypes={formatSeparatorThousand:{control:`text`,description:`Character used as thousand separator (e.g., "," for "1,234"). Default is ",".`}},NumberComponent=({type:e,Edit:t,asyncElements:n,manyElements:i,formatSeparatorThousand:a,formatSeparatorDecimal:o,formatDecimals:s,disabled:c})=>{let l=(0,r.useMemo)(()=>y.filter(e=>e.type===`number`).map(e=>{if(a!==void 0||o!==void 0||s!==void 0){let t={};return a!==void 0&&(t.separatorThousand=a),o!==void 0&&(t.separatorDecimal=o),s!==void 0&&(t.decimals=s),{...e,format:t}}return e}),[a,o,s]);return(0,g.jsx)(FieldTypeStory,{fields:l,type:e,Edit:t,asyncElements:n,manyElements:i,disabled:c})},NumberComponent.storyName=`number`,NumberComponent.args={formatSeparatorThousand:`,`,formatSeparatorDecimal:`.`,formatDecimals:2},NumberComponent.argTypes={formatSeparatorThousand:{control:`text`,description:`Character used as thousand separator (e.g., "," for "1,234"). Default is ",".`},formatSeparatorDecimal:{control:`text`,description:`Character used as decimal separator (e.g., "." for "1.23"). Default is ".".`},formatDecimals:{control:{type:`number`,min:0,max:100,step:1},description:`Number of decimal places to display (0-100). Default is 2.`}},BooleanComponent=({type:e,Edit:t,asyncElements:n,manyElements:i,disabled:a})=>{let o=(0,r.useMemo)(()=>y.filter(e=>e.type===`boolean`),[]);return(0,g.jsx)(FieldTypeStory,{fields:o,type:e,Edit:t,asyncElements:n,manyElements:i,disabled:a})},BooleanComponent.storyName=`boolean`,DateTimeComponent=({type:e,Edit:t,asyncElements:n,manyElements:i,formatDatetime:a,formatWeekStartsOn:o,disabled:s})=>{let c=(0,r.useMemo)(()=>y.filter(e=>e.id.startsWith(`datetime`)).map(e=>{if(a||o!==void 0){let t={};return a&&(t.datetime=a),o!==void 0&&(t.weekStartsOn=o),{...e,format:t}}return e}),[a,o]);return(0,g.jsx)(FieldTypeStory,{fields:c,type:e,Edit:t,asyncElements:n,manyElements:i,disabled:s})},DateTimeComponent.storyName=`datetime`,DateTimeComponent.args={formatDatetime:``,formatWeekStartsOn:void 0},DateTimeComponent.argTypes={formatDatetime:{control:`text`,description:`Custom PHP date format string (e.g., "M j, Y g:i a" for "Jan 1, 2021 2:30 pm"). Leave empty to use WordPress default.`},formatWeekStartsOn:{control:`select`,options:{Default:void 0,Sunday:0,Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6},description:`Day that the week starts on. Leave as Default to use WordPress default.`}},DateComponent=({type:e,Edit:t,asyncElements:n,manyElements:i,formatDate:a,formatWeekStartsOn:o,disabled:s})=>{let c=(0,r.useMemo)(()=>y.filter(e=>e.type===`date`).map(e=>{if(a||o!==void 0){let t={};return a&&(t.date=a),o!==void 0&&(t.weekStartsOn=o),{...e,format:t}}return e}),[a,o]);return(0,g.jsx)(FieldTypeStory,{fields:c,type:e,Edit:t,asyncElements:n,manyElements:i,disabled:s})},DateComponent.storyName=`date`,DateComponent.args={formatDate:``,formatWeekStartsOn:void 0},DateComponent.argTypes={formatDate:{control:`text`,description:`Custom PHP date format string (e.g., "F j, Y" for "November 6, 2010"). Leave empty to use WordPress default.`},formatWeekStartsOn:{control:`select`,options:{Default:void 0,Sunday:0,Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6},description:`Day that the week starts on. Leave as Default to use WordPress default.`}},TimeComponent=({type:e,Edit:t,asyncElements:n,manyElements:i,formatTime:a,disabled:o})=>{let s=(0,r.useMemo)(()=>y.filter(e=>e.type===`time`).map(e=>a?{...e,format:{time:a}}:e),[a]);return(0,g.jsx)(FieldTypeStory,{fields:s,type:e,Edit:t,asyncElements:n,manyElements:i,disabled:o})},TimeComponent.storyName=`time`,TimeComponent.args={formatTime:``},TimeComponent.argTypes={formatTime:{control:`text`,description:`Custom PHP time format string (e.g., "g:i a" for "2:30 pm"). Leave empty to use the format each field declares.`}},EmailComponent=({type:e,Edit:t,asyncElements:n,manyElements:i,disabled:a})=>{let o=(0,r.useMemo)(()=>y.filter(e=>e.type===`email`),[]);return(0,g.jsx)(FieldTypeStory,{fields:o,type:e,Edit:t,asyncElements:n,manyElements:i,disabled:a})},EmailComponent.storyName=`email`,TelephoneComponent=({type:e,Edit:t,asyncElements:n,manyElements:r,disabled:i})=>{let a=y.filter(e=>e.id.startsWith(`telephone`));return(0,g.jsx)(FieldTypeStory,{fields:a,type:e,Edit:t,asyncElements:n,manyElements:r,disabled:i})},TelephoneComponent.storyName=`telephone`,UrlComponent=({type:e,Edit:t,asyncElements:n,manyElements:i,disabled:a})=>{let o=(0,r.useMemo)(()=>y.filter(e=>e.type===`url`),[]);return(0,g.jsx)(FieldTypeStory,{fields:o,type:e,Edit:t,asyncElements:n,manyElements:i,disabled:a})},UrlComponent.storyName=`url`,ColorComponent=({type:e,Edit:t,asyncElements:n,manyElements:i,disabled:a})=>{let o=(0,r.useMemo)(()=>y.filter(e=>e.type===`color`),[]);return(0,g.jsx)(FieldTypeStory,{fields:o,type:e,Edit:t,asyncElements:n,manyElements:i,disabled:a})},ColorComponent.storyName=`color`,MediaComponent=({type:e,Edit:t,asyncElements:n,manyElements:i,disabled:a})=>{let o=(0,r.useMemo)(()=>y.filter(e=>e.type===`media`),[]);return(0,g.jsx)(FieldTypeStory,{fields:o,type:e,Edit:t,asyncElements:n,manyElements:i,disabled:a})},MediaComponent.storyName=`media`,ArrayComponent=({type:e,Edit:t,asyncElements:n,manyElements:i,disabled:a})=>{let o=(0,r.useMemo)(()=>y.filter(e=>e.type===`array`),[]);return(0,g.jsx)(FieldTypeStory,{fields:o,type:e,Edit:t,asyncElements:n,manyElements:i,disabled:a})},ArrayComponent.storyName=`array`,PasswordComponent=({type:e,Edit:t,asyncElements:n,manyElements:r,disabled:i})=>{let a=y.filter(e=>e.id.startsWith(`password`));return(0,g.jsx)(FieldTypeStory,{fields:a,type:e,Edit:t,asyncElements:n,manyElements:r,disabled:i})},PasswordComponent.storyName=`password`,NoTypeComponent=({type:e,Edit:t,asyncElements:n,manyElements:i,disabled:a})=>{let o=(0,r.useMemo)(()=>y.filter(e=>e.type===void 0),[]);return(0,g.jsx)(FieldTypeStory,{fields:o,type:e,Edit:t,asyncElements:n,manyElements:i,disabled:a})},NoTypeComponent.storyName=`No type`;try{_.__docgenInfo={description:"`DataForm` renders an auto-generated form for viewing and editing the fields\nof a data item, driven by a fields and form layout configuration. Use it to\nedit items of a dataset, often alongside `DataViews`.",displayName:`stories`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,methods:[],props:{data:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/types/dataform.ts`,name:`DataFormProps`}],description:`The item being edited.`,name:`data`,parent:{fileName:`gutenberg/packages/dataviews/src/types/dataform.ts`,name:`DataFormProps`},required:!0,tags:{},type:{name:`Item`}},fields:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/types/dataform.ts`,name:`DataFormProps`}],description:`The field definitions for the item.`,name:`fields`,parent:{fileName:`gutenberg/packages/dataviews/src/types/dataform.ts`,name:`DataFormProps`},required:!0,tags:{},type:{name:`Field<Item>[]`}},form:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/types/dataform.ts`,name:`DataFormProps`}],description:`The form configuration: which fields to render and with which layout.`,name:`form`,parent:{fileName:`gutenberg/packages/dataviews/src/types/dataform.ts`,name:`DataFormProps`},required:!0,tags:{},type:{name:`Form`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/types/dataform.ts`,name:`DataFormProps`}],description:"Callback invoked when the user edits a field, receiving the partial\nitem returned by the field's `setValue`. By default that is an object\nkeyed by field id, nested for dotted ids (e.g. `{ a: { b: value } }`\nfor the field `a.b`); a custom `setValue` may return any other partial\nshape of the item.",name:`onChange`,parent:{fileName:`gutenberg/packages/dataviews/src/types/dataform.ts`,name:`DataFormProps`},required:!0,tags:{},type:{name:`(value: Record<string, any>) => void`}},validity:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/types/dataform.ts`,name:`DataFormProps`}],description:`The validity state of the form's fields, keyed by field id.`,name:`validity`,parent:{fileName:`gutenberg/packages/dataviews/src/types/dataform.ts`,name:`DataFormProps`},required:!1,tags:{},type:{name:`FormValidity`}}},tags:{}}}catch{}try{AllComponent.__docgenInfo={description:``,displayName:`AllComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,methods:[],props:{type:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`type`,required:!0,tags:{},type:{name:`enum`,raw:`PanelTypes`,value:[{value:`"regular"`},{value:`"panel"`}]}},Edit:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`Edit`,required:!0,tags:{},type:{name:`enum`,raw:`ControlTypes`,value:[{value:`"number"`},{value:`"select"`},{value:`"default"`},{value:`"adaptiveSelect"`},{value:`"array"`},{value:`"checkbox"`},{value:`"color"`},{value:`"combobox"`},{value:`"date"`},{value:`"datetime"`},{value:`"email"`},{value:`"integer"`},{value:`"password"`},{value:`"radio"`},{value:`"telephone"`},{value:`"url"`},{value:`"text"`},{value:`"time"`},{value:`"toggle"`},{value:`"toggleGroup"`}]}},asyncElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`asyncElements`,required:!0,tags:{},type:{name:`boolean`}},manyElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`manyElements`,required:!0,tags:{},type:{name:`boolean`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`disabled`,required:!0,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}try{TextComponent.__docgenInfo={description:``,displayName:`TextComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,methods:[],props:{type:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`type`,required:!0,tags:{},type:{name:`enum`,raw:`PanelTypes`,value:[{value:`"regular"`},{value:`"panel"`}]}},Edit:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`Edit`,required:!0,tags:{},type:{name:`enum`,raw:`ControlTypes`,value:[{value:`"number"`},{value:`"select"`},{value:`"default"`},{value:`"adaptiveSelect"`},{value:`"array"`},{value:`"checkbox"`},{value:`"color"`},{value:`"combobox"`},{value:`"date"`},{value:`"datetime"`},{value:`"email"`},{value:`"integer"`},{value:`"password"`},{value:`"radio"`},{value:`"telephone"`},{value:`"url"`},{value:`"text"`},{value:`"time"`},{value:`"toggle"`},{value:`"toggleGroup"`}]}},asyncElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`asyncElements`,required:!0,tags:{},type:{name:`boolean`}},manyElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`manyElements`,required:!0,tags:{},type:{name:`boolean`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`disabled`,required:!0,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}try{IntegerComponent.__docgenInfo={description:``,displayName:`IntegerComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,methods:[],props:{type:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`type`,required:!0,tags:{},type:{name:`enum`,raw:`PanelTypes`,value:[{value:`"regular"`},{value:`"panel"`}]}},Edit:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`Edit`,required:!0,tags:{},type:{name:`enum`,raw:`ControlTypes`,value:[{value:`"number"`},{value:`"select"`},{value:`"default"`},{value:`"adaptiveSelect"`},{value:`"array"`},{value:`"checkbox"`},{value:`"color"`},{value:`"combobox"`},{value:`"date"`},{value:`"datetime"`},{value:`"email"`},{value:`"integer"`},{value:`"password"`},{value:`"radio"`},{value:`"telephone"`},{value:`"url"`},{value:`"text"`},{value:`"time"`},{value:`"toggle"`},{value:`"toggleGroup"`}]}},asyncElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`asyncElements`,required:!0,tags:{},type:{name:`boolean`}},manyElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`manyElements`,required:!0,tags:{},type:{name:`boolean`}},formatSeparatorThousand:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`formatSeparatorThousand`,required:!1,tags:{},type:{name:`string`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`disabled`,required:!0,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}try{NumberComponent.__docgenInfo={description:``,displayName:`NumberComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,methods:[],props:{type:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`type`,required:!0,tags:{},type:{name:`enum`,raw:`PanelTypes`,value:[{value:`"regular"`},{value:`"panel"`}]}},Edit:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`Edit`,required:!0,tags:{},type:{name:`enum`,raw:`ControlTypes`,value:[{value:`"number"`},{value:`"select"`},{value:`"default"`},{value:`"adaptiveSelect"`},{value:`"array"`},{value:`"checkbox"`},{value:`"color"`},{value:`"combobox"`},{value:`"date"`},{value:`"datetime"`},{value:`"email"`},{value:`"integer"`},{value:`"password"`},{value:`"radio"`},{value:`"telephone"`},{value:`"url"`},{value:`"text"`},{value:`"time"`},{value:`"toggle"`},{value:`"toggleGroup"`}]}},asyncElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`asyncElements`,required:!0,tags:{},type:{name:`boolean`}},manyElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`manyElements`,required:!0,tags:{},type:{name:`boolean`}},formatSeparatorThousand:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`formatSeparatorThousand`,required:!1,tags:{},type:{name:`string`}},formatSeparatorDecimal:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`formatSeparatorDecimal`,required:!1,tags:{},type:{name:`string`}},formatDecimals:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`formatDecimals`,required:!1,tags:{},type:{name:`number`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`disabled`,required:!0,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}try{BooleanComponent.__docgenInfo={description:``,displayName:`BooleanComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,methods:[],props:{type:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`type`,required:!0,tags:{},type:{name:`enum`,raw:`PanelTypes`,value:[{value:`"regular"`},{value:`"panel"`}]}},Edit:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`Edit`,required:!0,tags:{},type:{name:`enum`,raw:`ControlTypes`,value:[{value:`"number"`},{value:`"select"`},{value:`"default"`},{value:`"adaptiveSelect"`},{value:`"array"`},{value:`"checkbox"`},{value:`"color"`},{value:`"combobox"`},{value:`"date"`},{value:`"datetime"`},{value:`"email"`},{value:`"integer"`},{value:`"password"`},{value:`"radio"`},{value:`"telephone"`},{value:`"url"`},{value:`"text"`},{value:`"time"`},{value:`"toggle"`},{value:`"toggleGroup"`}]}},asyncElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`asyncElements`,required:!0,tags:{},type:{name:`boolean`}},manyElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`manyElements`,required:!0,tags:{},type:{name:`boolean`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`disabled`,required:!0,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}try{DateTimeComponent.__docgenInfo={description:``,displayName:`DateTimeComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,methods:[],props:{type:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`type`,required:!0,tags:{},type:{name:`enum`,raw:`PanelTypes`,value:[{value:`"regular"`},{value:`"panel"`}]}},Edit:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`Edit`,required:!0,tags:{},type:{name:`enum`,raw:`ControlTypes`,value:[{value:`"number"`},{value:`"select"`},{value:`"default"`},{value:`"adaptiveSelect"`},{value:`"array"`},{value:`"checkbox"`},{value:`"color"`},{value:`"combobox"`},{value:`"date"`},{value:`"datetime"`},{value:`"email"`},{value:`"integer"`},{value:`"password"`},{value:`"radio"`},{value:`"telephone"`},{value:`"url"`},{value:`"text"`},{value:`"time"`},{value:`"toggle"`},{value:`"toggleGroup"`}]}},asyncElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`asyncElements`,required:!0,tags:{},type:{name:`boolean`}},manyElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`manyElements`,required:!0,tags:{},type:{name:`boolean`}},formatDatetime:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`formatDatetime`,required:!1,tags:{},type:{name:`string`}},formatWeekStartsOn:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`formatWeekStartsOn`,required:!1,tags:{},type:{name:`enum`,raw:`0 | 1 | 2 | 3 | 4 | 5 | 6`,value:[{value:`0`},{value:`1`},{value:`2`},{value:`3`},{value:`4`},{value:`5`},{value:`6`}]}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`disabled`,required:!0,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}try{DateComponent.__docgenInfo={description:``,displayName:`DateComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,methods:[],props:{type:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`type`,required:!0,tags:{},type:{name:`enum`,raw:`PanelTypes`,value:[{value:`"regular"`},{value:`"panel"`}]}},Edit:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`Edit`,required:!0,tags:{},type:{name:`enum`,raw:`ControlTypes`,value:[{value:`"number"`},{value:`"select"`},{value:`"default"`},{value:`"adaptiveSelect"`},{value:`"array"`},{value:`"checkbox"`},{value:`"color"`},{value:`"combobox"`},{value:`"date"`},{value:`"datetime"`},{value:`"email"`},{value:`"integer"`},{value:`"password"`},{value:`"radio"`},{value:`"telephone"`},{value:`"url"`},{value:`"text"`},{value:`"time"`},{value:`"toggle"`},{value:`"toggleGroup"`}]}},asyncElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`asyncElements`,required:!0,tags:{},type:{name:`boolean`}},manyElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`manyElements`,required:!0,tags:{},type:{name:`boolean`}},formatDate:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`formatDate`,required:!1,tags:{},type:{name:`string`}},formatWeekStartsOn:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`formatWeekStartsOn`,required:!1,tags:{},type:{name:`enum`,raw:`0 | 1 | 2 | 3 | 4 | 5 | 6`,value:[{value:`0`},{value:`1`},{value:`2`},{value:`3`},{value:`4`},{value:`5`},{value:`6`}]}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`disabled`,required:!0,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}try{TimeComponent.__docgenInfo={description:``,displayName:`TimeComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,methods:[],props:{type:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`type`,required:!0,tags:{},type:{name:`enum`,raw:`PanelTypes`,value:[{value:`"regular"`},{value:`"panel"`}]}},Edit:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`Edit`,required:!0,tags:{},type:{name:`enum`,raw:`ControlTypes`,value:[{value:`"number"`},{value:`"select"`},{value:`"default"`},{value:`"adaptiveSelect"`},{value:`"array"`},{value:`"checkbox"`},{value:`"color"`},{value:`"combobox"`},{value:`"date"`},{value:`"datetime"`},{value:`"email"`},{value:`"integer"`},{value:`"password"`},{value:`"radio"`},{value:`"telephone"`},{value:`"url"`},{value:`"text"`},{value:`"time"`},{value:`"toggle"`},{value:`"toggleGroup"`}]}},asyncElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`asyncElements`,required:!0,tags:{},type:{name:`boolean`}},manyElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`manyElements`,required:!0,tags:{},type:{name:`boolean`}},formatTime:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`formatTime`,required:!1,tags:{},type:{name:`string`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`disabled`,required:!0,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}try{EmailComponent.__docgenInfo={description:``,displayName:`EmailComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,methods:[],props:{type:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`type`,required:!0,tags:{},type:{name:`enum`,raw:`PanelTypes`,value:[{value:`"regular"`},{value:`"panel"`}]}},Edit:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`Edit`,required:!0,tags:{},type:{name:`enum`,raw:`ControlTypes`,value:[{value:`"number"`},{value:`"select"`},{value:`"default"`},{value:`"adaptiveSelect"`},{value:`"array"`},{value:`"checkbox"`},{value:`"color"`},{value:`"combobox"`},{value:`"date"`},{value:`"datetime"`},{value:`"email"`},{value:`"integer"`},{value:`"password"`},{value:`"radio"`},{value:`"telephone"`},{value:`"url"`},{value:`"text"`},{value:`"time"`},{value:`"toggle"`},{value:`"toggleGroup"`}]}},asyncElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`asyncElements`,required:!0,tags:{},type:{name:`boolean`}},manyElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`manyElements`,required:!0,tags:{},type:{name:`boolean`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`disabled`,required:!0,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}try{TelephoneComponent.__docgenInfo={description:``,displayName:`TelephoneComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,methods:[],props:{type:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`type`,required:!0,tags:{},type:{name:`enum`,raw:`PanelTypes`,value:[{value:`"regular"`},{value:`"panel"`}]}},Edit:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`Edit`,required:!0,tags:{},type:{name:`enum`,raw:`ControlTypes`,value:[{value:`"number"`},{value:`"select"`},{value:`"default"`},{value:`"adaptiveSelect"`},{value:`"array"`},{value:`"checkbox"`},{value:`"color"`},{value:`"combobox"`},{value:`"date"`},{value:`"datetime"`},{value:`"email"`},{value:`"integer"`},{value:`"password"`},{value:`"radio"`},{value:`"telephone"`},{value:`"url"`},{value:`"text"`},{value:`"time"`},{value:`"toggle"`},{value:`"toggleGroup"`}]}},asyncElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`asyncElements`,required:!0,tags:{},type:{name:`boolean`}},manyElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`manyElements`,required:!0,tags:{},type:{name:`boolean`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`disabled`,required:!0,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}try{UrlComponent.__docgenInfo={description:``,displayName:`UrlComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,methods:[],props:{type:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`type`,required:!0,tags:{},type:{name:`enum`,raw:`PanelTypes`,value:[{value:`"regular"`},{value:`"panel"`}]}},Edit:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`Edit`,required:!0,tags:{},type:{name:`enum`,raw:`ControlTypes`,value:[{value:`"number"`},{value:`"select"`},{value:`"default"`},{value:`"adaptiveSelect"`},{value:`"array"`},{value:`"checkbox"`},{value:`"color"`},{value:`"combobox"`},{value:`"date"`},{value:`"datetime"`},{value:`"email"`},{value:`"integer"`},{value:`"password"`},{value:`"radio"`},{value:`"telephone"`},{value:`"url"`},{value:`"text"`},{value:`"time"`},{value:`"toggle"`},{value:`"toggleGroup"`}]}},asyncElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`asyncElements`,required:!0,tags:{},type:{name:`boolean`}},manyElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`manyElements`,required:!0,tags:{},type:{name:`boolean`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`disabled`,required:!0,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}try{ColorComponent.__docgenInfo={description:``,displayName:`ColorComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,methods:[],props:{type:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`type`,required:!0,tags:{},type:{name:`enum`,raw:`PanelTypes`,value:[{value:`"regular"`},{value:`"panel"`}]}},Edit:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`Edit`,required:!0,tags:{},type:{name:`enum`,raw:`ControlTypes`,value:[{value:`"number"`},{value:`"select"`},{value:`"default"`},{value:`"adaptiveSelect"`},{value:`"array"`},{value:`"checkbox"`},{value:`"color"`},{value:`"combobox"`},{value:`"date"`},{value:`"datetime"`},{value:`"email"`},{value:`"integer"`},{value:`"password"`},{value:`"radio"`},{value:`"telephone"`},{value:`"url"`},{value:`"text"`},{value:`"time"`},{value:`"toggle"`},{value:`"toggleGroup"`}]}},asyncElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`asyncElements`,required:!0,tags:{},type:{name:`boolean`}},manyElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`manyElements`,required:!0,tags:{},type:{name:`boolean`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`disabled`,required:!0,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}try{MediaComponent.__docgenInfo={description:``,displayName:`MediaComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,methods:[],props:{type:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`type`,required:!0,tags:{},type:{name:`enum`,raw:`PanelTypes`,value:[{value:`"regular"`},{value:`"panel"`}]}},Edit:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`Edit`,required:!0,tags:{},type:{name:`enum`,raw:`ControlTypes`,value:[{value:`"number"`},{value:`"select"`},{value:`"default"`},{value:`"adaptiveSelect"`},{value:`"array"`},{value:`"checkbox"`},{value:`"color"`},{value:`"combobox"`},{value:`"date"`},{value:`"datetime"`},{value:`"email"`},{value:`"integer"`},{value:`"password"`},{value:`"radio"`},{value:`"telephone"`},{value:`"url"`},{value:`"text"`},{value:`"time"`},{value:`"toggle"`},{value:`"toggleGroup"`}]}},asyncElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`asyncElements`,required:!0,tags:{},type:{name:`boolean`}},manyElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`manyElements`,required:!0,tags:{},type:{name:`boolean`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`disabled`,required:!0,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}try{ArrayComponent.__docgenInfo={description:``,displayName:`ArrayComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,methods:[],props:{type:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`type`,required:!0,tags:{},type:{name:`enum`,raw:`PanelTypes`,value:[{value:`"regular"`},{value:`"panel"`}]}},Edit:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`Edit`,required:!0,tags:{},type:{name:`enum`,raw:`ControlTypes`,value:[{value:`"number"`},{value:`"select"`},{value:`"default"`},{value:`"adaptiveSelect"`},{value:`"array"`},{value:`"checkbox"`},{value:`"color"`},{value:`"combobox"`},{value:`"date"`},{value:`"datetime"`},{value:`"email"`},{value:`"integer"`},{value:`"password"`},{value:`"radio"`},{value:`"telephone"`},{value:`"url"`},{value:`"text"`},{value:`"time"`},{value:`"toggle"`},{value:`"toggleGroup"`}]}},asyncElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`asyncElements`,required:!0,tags:{},type:{name:`boolean`}},manyElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`manyElements`,required:!0,tags:{},type:{name:`boolean`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`disabled`,required:!0,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}try{PasswordComponent.__docgenInfo={description:``,displayName:`PasswordComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,methods:[],props:{type:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`type`,required:!0,tags:{},type:{name:`enum`,raw:`PanelTypes`,value:[{value:`"regular"`},{value:`"panel"`}]}},Edit:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`Edit`,required:!0,tags:{},type:{name:`enum`,raw:`ControlTypes`,value:[{value:`"number"`},{value:`"select"`},{value:`"default"`},{value:`"adaptiveSelect"`},{value:`"array"`},{value:`"checkbox"`},{value:`"color"`},{value:`"combobox"`},{value:`"date"`},{value:`"datetime"`},{value:`"email"`},{value:`"integer"`},{value:`"password"`},{value:`"radio"`},{value:`"telephone"`},{value:`"url"`},{value:`"text"`},{value:`"time"`},{value:`"toggle"`},{value:`"toggleGroup"`}]}},asyncElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`asyncElements`,required:!0,tags:{},type:{name:`boolean`}},manyElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`manyElements`,required:!0,tags:{},type:{name:`boolean`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`disabled`,required:!0,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}try{NoTypeComponent.__docgenInfo={description:``,displayName:`NoTypeComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,methods:[],props:{type:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`type`,required:!0,tags:{},type:{name:`enum`,raw:`PanelTypes`,value:[{value:`"regular"`},{value:`"panel"`}]}},Edit:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`Edit`,required:!0,tags:{},type:{name:`enum`,raw:`ControlTypes`,value:[{value:`"number"`},{value:`"select"`},{value:`"default"`},{value:`"adaptiveSelect"`},{value:`"array"`},{value:`"checkbox"`},{value:`"color"`},{value:`"combobox"`},{value:`"date"`},{value:`"datetime"`},{value:`"email"`},{value:`"integer"`},{value:`"password"`},{value:`"radio"`},{value:`"telephone"`},{value:`"url"`},{value:`"text"`},{value:`"time"`},{value:`"toggle"`},{value:`"toggleGroup"`}]}},asyncElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`asyncElements`,required:!0,tags:{},type:{name:`boolean`}},manyElements:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`manyElements`,required:!0,tags:{},type:{name:`boolean`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/field-types/stories/index.story.tsx`,name:`TypeLiteral`}],description:``,name:`disabled`,required:!0,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}AllComponent.parameters={...AllComponent.parameters,docs:{...AllComponent.parameters?.docs,source:{originalSource:`({
  type,
  Edit,
  asyncElements,
  manyElements,
  disabled
}: {
  type: PanelTypes;
  Edit: ControlTypes;
  asyncElements: boolean;
  manyElements: boolean;
  disabled: boolean;
}) => {
  return <FieldTypeStory fields={fields} type={type} Edit={Edit} asyncElements={asyncElements} manyElements={manyElements} disabled={disabled} />;
}`,...AllComponent.parameters?.docs?.source}}},TextComponent.parameters={...TextComponent.parameters,docs:{...TextComponent.parameters?.docs,source:{originalSource:`({
  type,
  Edit,
  asyncElements,
  manyElements,
  disabled
}: {
  type: PanelTypes;
  Edit: ControlTypes;
  asyncElements: boolean;
  manyElements: boolean;
  disabled: boolean;
}) => {
  const textFields = useMemo(() => fields.filter(field => field.type === 'text'), []);
  return <FieldTypeStory fields={textFields} type={type} Edit={Edit} asyncElements={asyncElements} manyElements={manyElements} disabled={disabled} />;
}`,...TextComponent.parameters?.docs?.source}}},IntegerComponent.parameters={...IntegerComponent.parameters,docs:{...IntegerComponent.parameters?.docs,source:{originalSource:`({
  type,
  Edit,
  asyncElements,
  manyElements,
  formatSeparatorThousand,
  disabled
}: {
  type: PanelTypes;
  Edit: ControlTypes;
  asyncElements: boolean;
  manyElements: boolean;
  formatSeparatorThousand?: string;
  disabled: boolean;
}) => {
  const integerFields = useMemo(() => fields.filter(field => field.type === 'integer').map(field => {
    if (formatSeparatorThousand !== undefined) {
      return {
        ...field,
        format: {
          separatorThousand: formatSeparatorThousand
        }
      };
    }
    return field;
  }), [formatSeparatorThousand]);
  return <FieldTypeStory fields={integerFields} type={type} Edit={Edit} asyncElements={asyncElements} manyElements={manyElements} disabled={disabled} />;
}`,...IntegerComponent.parameters?.docs?.source}}},NumberComponent.parameters={...NumberComponent.parameters,docs:{...NumberComponent.parameters?.docs,source:{originalSource:`({
  type,
  Edit,
  asyncElements,
  manyElements,
  formatSeparatorThousand,
  formatSeparatorDecimal,
  formatDecimals,
  disabled
}: {
  type: PanelTypes;
  Edit: ControlTypes;
  asyncElements: boolean;
  manyElements: boolean;
  formatSeparatorThousand?: string;
  formatSeparatorDecimal?: string;
  formatDecimals?: number;
  disabled: boolean;
}) => {
  const numberFields = useMemo(() => fields.filter(field => field.type === 'number').map(field => {
    if (formatSeparatorThousand !== undefined || formatSeparatorDecimal !== undefined || formatDecimals !== undefined) {
      const format: {
        separatorThousand?: string;
        separatorDecimal?: string;
        decimals?: number;
      } = {};
      if (formatSeparatorThousand !== undefined) {
        format.separatorThousand = formatSeparatorThousand;
      }
      if (formatSeparatorDecimal !== undefined) {
        format.separatorDecimal = formatSeparatorDecimal;
      }
      if (formatDecimals !== undefined) {
        format.decimals = formatDecimals;
      }
      return {
        ...field,
        format
      };
    }
    return field;
  }), [formatSeparatorThousand, formatSeparatorDecimal, formatDecimals]);
  return <FieldTypeStory fields={numberFields} type={type} Edit={Edit} asyncElements={asyncElements} manyElements={manyElements} disabled={disabled} />;
}`,...NumberComponent.parameters?.docs?.source}}},BooleanComponent.parameters={...BooleanComponent.parameters,docs:{...BooleanComponent.parameters?.docs,source:{originalSource:`({
  type,
  Edit,
  asyncElements,
  manyElements,
  disabled
}: {
  type: PanelTypes;
  Edit: ControlTypes;
  asyncElements: boolean;
  manyElements: boolean;
  disabled: boolean;
}) => {
  const booleanFields = useMemo(() => fields.filter(field => field.type === 'boolean'), []);
  return <FieldTypeStory fields={booleanFields} type={type} Edit={Edit} asyncElements={asyncElements} manyElements={manyElements} disabled={disabled} />;
}`,...BooleanComponent.parameters?.docs?.source}}},DateTimeComponent.parameters={...DateTimeComponent.parameters,docs:{...DateTimeComponent.parameters?.docs,source:{originalSource:`({
  type,
  Edit,
  asyncElements,
  manyElements,
  formatDatetime,
  formatWeekStartsOn,
  disabled
}: {
  type: PanelTypes;
  Edit: ControlTypes;
  asyncElements: boolean;
  manyElements: boolean;
  formatDatetime?: string;
  formatWeekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  disabled: boolean;
}) => {
  const datetimeFields = useMemo(() => fields.filter(field => field.id.startsWith('datetime')).map(field => {
    if (formatDatetime || formatWeekStartsOn !== undefined) {
      const format: {
        datetime?: string;
        weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
      } = {};
      if (formatDatetime) {
        format.datetime = formatDatetime;
      }
      if (formatWeekStartsOn !== undefined) {
        format.weekStartsOn = formatWeekStartsOn;
      }
      return {
        ...field,
        format
      };
    }
    return field;
  }), [formatDatetime, formatWeekStartsOn]);
  return <FieldTypeStory fields={datetimeFields} type={type} Edit={Edit} asyncElements={asyncElements} manyElements={manyElements} disabled={disabled} />;
}`,...DateTimeComponent.parameters?.docs?.source}}},DateComponent.parameters={...DateComponent.parameters,docs:{...DateComponent.parameters?.docs,source:{originalSource:`({
  type,
  Edit,
  asyncElements,
  manyElements,
  formatDate,
  formatWeekStartsOn,
  disabled
}: {
  type: PanelTypes;
  Edit: ControlTypes;
  asyncElements: boolean;
  manyElements: boolean;
  formatDate?: string;
  formatWeekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  disabled: boolean;
}) => {
  const dateFields = useMemo(() => fields.filter(field => field.type === 'date').map(field => {
    if (formatDate || formatWeekStartsOn !== undefined) {
      const format: {
        date?: string;
        weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
      } = {};
      if (formatDate) {
        format.date = formatDate;
      }
      if (formatWeekStartsOn !== undefined) {
        format.weekStartsOn = formatWeekStartsOn;
      }
      return {
        ...field,
        format
      };
    }
    return field;
  }), [formatDate, formatWeekStartsOn]);
  return <FieldTypeStory fields={dateFields} type={type} Edit={Edit} asyncElements={asyncElements} manyElements={manyElements} disabled={disabled} />;
}`,...DateComponent.parameters?.docs?.source}}},TimeComponent.parameters={...TimeComponent.parameters,docs:{...TimeComponent.parameters?.docs,source:{originalSource:`({
  type,
  Edit,
  asyncElements,
  manyElements,
  formatTime,
  disabled
}: {
  type: PanelTypes;
  Edit: ControlTypes;
  asyncElements: boolean;
  manyElements: boolean;
  formatTime?: string;
  disabled: boolean;
}) => {
  const timeFields = useMemo(() => fields.filter(field => field.type === 'time').map(field => formatTime ? {
    ...field,
    format: {
      time: formatTime
    }
  } : field), [formatTime]);
  return <FieldTypeStory fields={timeFields} type={type} Edit={Edit} asyncElements={asyncElements} manyElements={manyElements} disabled={disabled} />;
}`,...TimeComponent.parameters?.docs?.source}}},EmailComponent.parameters={...EmailComponent.parameters,docs:{...EmailComponent.parameters?.docs,source:{originalSource:`({
  type,
  Edit,
  asyncElements,
  manyElements,
  disabled
}: {
  type: PanelTypes;
  Edit: ControlTypes;
  asyncElements: boolean;
  manyElements: boolean;
  disabled: boolean;
}) => {
  const emailFields = useMemo(() => fields.filter(field => field.type === 'email'), []);
  return <FieldTypeStory fields={emailFields} type={type} Edit={Edit} asyncElements={asyncElements} manyElements={manyElements} disabled={disabled} />;
}`,...EmailComponent.parameters?.docs?.source}}},TelephoneComponent.parameters={...TelephoneComponent.parameters,docs:{...TelephoneComponent.parameters?.docs,source:{originalSource:`({
  type,
  Edit,
  asyncElements,
  manyElements,
  disabled
}: {
  type: PanelTypes;
  Edit: ControlTypes;
  asyncElements: boolean;
  manyElements: boolean;
  disabled: boolean;
}) => {
  const telephoneFields = fields.filter(field => field.id.startsWith('telephone'));
  return <FieldTypeStory fields={telephoneFields} type={type} Edit={Edit} asyncElements={asyncElements} manyElements={manyElements} disabled={disabled} />;
}`,...TelephoneComponent.parameters?.docs?.source}}},UrlComponent.parameters={...UrlComponent.parameters,docs:{...UrlComponent.parameters?.docs,source:{originalSource:`({
  type,
  Edit,
  asyncElements,
  manyElements,
  disabled
}: {
  type: PanelTypes;
  Edit: ControlTypes;
  asyncElements: boolean;
  manyElements: boolean;
  disabled: boolean;
}) => {
  const urlFields = useMemo(() => fields.filter(field => field.type === 'url'), []);
  return <FieldTypeStory fields={urlFields} type={type} Edit={Edit} asyncElements={asyncElements} manyElements={manyElements} disabled={disabled} />;
}`,...UrlComponent.parameters?.docs?.source}}},ColorComponent.parameters={...ColorComponent.parameters,docs:{...ColorComponent.parameters?.docs,source:{originalSource:`({
  type,
  Edit,
  asyncElements,
  manyElements,
  disabled
}: {
  type: PanelTypes;
  Edit: ControlTypes;
  asyncElements: boolean;
  manyElements: boolean;
  disabled: boolean;
}) => {
  const colorFields = useMemo(() => fields.filter(field => field.type === 'color'), []);
  return <FieldTypeStory fields={colorFields} type={type} Edit={Edit} asyncElements={asyncElements} manyElements={manyElements} disabled={disabled} />;
}`,...ColorComponent.parameters?.docs?.source}}},MediaComponent.parameters={...MediaComponent.parameters,docs:{...MediaComponent.parameters?.docs,source:{originalSource:`({
  type,
  Edit,
  asyncElements,
  manyElements,
  disabled
}: {
  type: PanelTypes;
  Edit: ControlTypes;
  asyncElements: boolean;
  manyElements: boolean;
  disabled: boolean;
}) => {
  const mediaFields = useMemo(() => fields.filter(field => field.type === 'media'), []);
  return <FieldTypeStory fields={mediaFields} type={type} Edit={Edit} asyncElements={asyncElements} manyElements={manyElements} disabled={disabled} />;
}`,...MediaComponent.parameters?.docs?.source}}},ArrayComponent.parameters={...ArrayComponent.parameters,docs:{...ArrayComponent.parameters?.docs,source:{originalSource:`({
  type,
  Edit,
  asyncElements,
  manyElements,
  disabled
}: {
  type: PanelTypes;
  Edit: ControlTypes;
  asyncElements: boolean;
  manyElements: boolean;
  disabled: boolean;
}) => {
  const arrayTextFields = useMemo(() => fields.filter(field => field.type === 'array'), []);
  return <FieldTypeStory fields={arrayTextFields} type={type} Edit={Edit} asyncElements={asyncElements} manyElements={manyElements} disabled={disabled} />;
}`,...ArrayComponent.parameters?.docs?.source}}},PasswordComponent.parameters={...PasswordComponent.parameters,docs:{...PasswordComponent.parameters?.docs,source:{originalSource:`({
  type,
  Edit,
  asyncElements,
  manyElements,
  disabled
}: {
  type: PanelTypes;
  Edit: ControlTypes;
  asyncElements: boolean;
  manyElements: boolean;
  disabled: boolean;
}) => {
  const passwordFields = fields.filter(field => field.id.startsWith('password'));
  return <FieldTypeStory fields={passwordFields} type={type} Edit={Edit} asyncElements={asyncElements} manyElements={manyElements} disabled={disabled} />;
}`,...PasswordComponent.parameters?.docs?.source}}},NoTypeComponent.parameters={...NoTypeComponent.parameters,docs:{...NoTypeComponent.parameters?.docs,source:{originalSource:`({
  type,
  Edit,
  asyncElements,
  manyElements,
  disabled
}: {
  type: PanelTypes;
  Edit: ControlTypes;
  asyncElements: boolean;
  manyElements: boolean;
  disabled: boolean;
}) => {
  const noTypeFields = useMemo(() => fields.filter(field => field.type === undefined), []);
  return <FieldTypeStory fields={noTypeFields} type={type} Edit={Edit} asyncElements={asyncElements} manyElements={manyElements} disabled={disabled} />;
}`,...NoTypeComponent.parameters?.docs?.source}}}})))()}init_index_story();export{AllComponent,ArrayComponent,BooleanComponent,ColorComponent,DateComponent,DateTimeComponent,EmailComponent,IntegerComponent,MediaComponent,NoTypeComponent,NumberComponent,PasswordComponent,TelephoneComponent,TextComponent,TimeComponent,UrlComponent,_ as default};