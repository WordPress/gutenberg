import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./duotone-picker-CacOu3IX.js";var o,s,c,l,u,d,Template,f,p;function init_duotone_picker_story(){return(init_duotone_picker_story=e((()=>{n(),i(),o=t(),{fn:s}=__STORYBOOK_MODULE_TEST__,c={id:`components-duotonepicker`,title:`Components/@wordpress-components/DuotonePicker`,component:a,args:{onChange:s()},argTypes:{selectedSlug:{control:!1},value:{control:!1}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`editor`}}},l=[{colors:[`#8c00b7`,`#fcff41`],name:`Purple and yellow`,slug:`purple-yellow`},{colors:[`#000097`,`#ff4747`],name:`Blue and red`,slug:`blue-red`}],u=[{colors:[`#000000`,`#ffffff`],name:`Dark background`,slug:`dark-background`},{colors:[`#000000`,`#ffffff`],name:`Dark text`,slug:`dark-text`}],d=[{color:`#ff4747`,name:`Red`,slug:`red`},{color:`#fcff41`,name:`Yellow`,slug:`yellow`},{color:`#000097`,name:`Blue`,slug:`blue`},{color:`#8c00b7`,name:`Purple`,slug:`purple`}],Template=({onChange:e,value:t,selectedSlug:n,...i})=>{let[s,c]=(0,r.useState)(t),[l,u]=(0,r.useState)(n);return(0,o.jsx)(a,{...i,value:s,selectedSlug:l,onChange:(t,n,r)=>{c(t),u(r),e?.(t,n,r)}})},f={render:Template,args:{colorPalette:d,duotonePalette:l}},p={render:Template,args:{colorPalette:d,duotonePalette:u},parameters:{docs:{description:{story:`Two presets can hold the same pair of colors. Selection is tracked by slug, so picking one marks only that preset rather than both.`}}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: Template,
  args: {
    colorPalette: COLOR_PALETTE,
    duotonePalette: DUOTONE_PALETTE
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: Template,
  args: {
    colorPalette: COLOR_PALETTE,
    duotonePalette: DUPLICATE_DUOTONE_PALETTE
  },
  parameters: {
    docs: {
      description: {
        story: 'Two presets can hold the same pair of colors. Selection is tracked by slug, so picking one marks only that preset rather than both.'
      }
    }
  }
}`,...p.parameters?.docs?.source}}}})))()}init_duotone_picker_story();export{f as Default,p as DuplicateDuotones,c as default};