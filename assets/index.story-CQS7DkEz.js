import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./stack-CzK5c0hq.js";var i,a,DemoBox,o,s;function init_index_story(){return(init_index_story=e((()=>{n(),i=t(),a={tags:[`manifest`],title:`Components/@wordpress-ui/Stack`,id:`design-system-components-stack`,component:r,parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},DemoBox=({variant:e})=>(0,i.jsx)(`div`,{style:{backgroundColor:`var(--wpds-color-background-surface-brand, color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 9%, white))`,width:e===`lg`?`150px`:`100px`,height:e===`lg`?`150px`:`100px`}}),o={args:{gap:`md`,children:[(0,i.jsx)(DemoBox,{},`demoBox`),(0,i.jsx)(DemoBox,{variant:`lg`},`demoBox-2`),(0,i.jsx)(DemoBox,{},`demoBox-3`),(0,i.jsx)(DemoBox,{},`demoBox-4`),(0,i.jsx)(DemoBox,{variant:`lg`},`demoBox-5`),(0,i.jsx)(DemoBox,{},`demoBox-6`)]},argTypes:{align:{options:[`center`,`end`,`flex-end`,`flex-start`,`start`,`baseline`,`stretch`],table:{type:{summary:`"center" | "end" | "flex-end" | "flex-start" | "start" | "baseline" | "stretch"`}}},justify:{options:[`space-around`,`space-between`,`space-evenly`,`stretch`,`center`,`end`,`flex-end`,`flex-start`,`start`,`left`,`right`],table:{type:{summary:`"space-around" | "space-between" | "space-evenly" | "stretch" | "center" | "end" | "flex-end" | "flex-start" | "start"`}}},wrap:{options:[`wrap`],table:{type:{summary:`"wrap"`}}}}},s={...o,args:{...o.args,align:`center`,justify:`center`,children:[(0,i.jsx)(DemoBox,{variant:`lg`},`demoBox`),(0,i.jsxs)(r,{gap:`lg`,children:[(0,i.jsx)(DemoBox,{}),(0,i.jsx)(DemoBox,{})]},`stack`),(0,i.jsx)(DemoBox,{variant:`lg`},`demoBox-2`),(0,i.jsxs)(r,{direction:`column`,children:[(0,i.jsx)(DemoBox,{}),(0,i.jsx)(DemoBox,{})]},`stack-2`),(0,i.jsx)(DemoBox,{variant:`lg`},`demoBox-3`)]}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    gap: 'md',
    children: [<DemoBox key="demoBox" />, <DemoBox variant="lg" key="demoBox-2" />, <DemoBox key="demoBox-3" />, <DemoBox key="demoBox-4" />, <DemoBox variant="lg" key="demoBox-5" />, <DemoBox key="demoBox-6" />]
  },
  argTypes: {
    align: {
      options: ['center', 'end', 'flex-end', 'flex-start', 'start', 'baseline', 'stretch'],
      table: {
        type: {
          summary: '"center" | "end" | "flex-end" | "flex-start" | "start" | "baseline" | "stretch"'
        }
      }
    },
    justify: {
      options: ['space-around', 'space-between', 'space-evenly', 'stretch', 'center', 'end', 'flex-end', 'flex-start', 'start', 'left', 'right'],
      table: {
        type: {
          summary: '"space-around" | "space-between" | "space-evenly" | "stretch" | "center" | "end" | "flex-end" | "flex-start" | "start"'
        }
      }
    },
    wrap: {
      options: ['wrap'],
      table: {
        type: {
          summary: '"wrap"'
        }
      }
    }
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    align: 'center',
    justify: 'center',
    children: [<DemoBox variant="lg" key="demoBox" />, <Stack gap="lg" key="stack">
                <DemoBox />
                <DemoBox />
            </Stack>, <DemoBox variant="lg" key="demoBox-2" />, <Stack direction="column" key="stack-2">
                <DemoBox />
                <DemoBox />
            </Stack>, <DemoBox variant="lg" key="demoBox-3" />]
  }
}`,...s.parameters?.docs?.source}}}})))()}init_index_story();export{o as Default,s as Nested,a as default};