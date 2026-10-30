import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{r as i,t as a}from"./color-palette-kq_aH_cX.js";var o,s,Template,c,l,u,d,f;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={tags:[`manifest`],title:`Components/@wordpress-components/Selection & Input/Color/ColorPalette`,id:`components-colorpalette`,component:a,argTypes:{as:{control:!1},onChange:{action:`onChange`,control:!1},selectedSlug:{control:!1},value:{control:!1}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`global`}}},Template=({onChange:e,value:t,selectedSlug:n,...i})=>{let[s,c]=(0,r.useState)(t),[l,u]=(0,r.useState)(n);return(0,o.jsx)(a,{...i,value:s,selectedSlug:l,onChange:(t,n,r)=>{c(t),u(r),e?.(t,n,r)}})},c={render:Template,args:{colors:[{name:`Red`,color:`#f00`},{name:`White`,color:`#fff`},{name:`Blue`,color:`#00f`}]}},l={render:Template,args:{colors:[{name:`Red`,color:`#f00`},{name:`White`,color:`#fff`},{name:`Blue`,color:`#00f`}],value:`#00f`}},u={parameters:{a11y:{test:`todo`}},render:Template,args:{colors:[{name:`Primary colors`,colors:[{name:`Red`,color:`#f00`},{name:`Yellow`,color:`#ff0`},{name:`Blue`,color:`#00f`}]},{name:`Secondary colors`,colors:[{name:`Orange`,color:`#f60`},{name:`Green`,color:`#0f0`},{name:`Purple`,color:`#60f`}]}]}},d={render:Template,args:{colors:[{name:`Dark Background`,slug:`dark-background`,color:`#000`},{name:`Dark Text`,slug:`dark-text`,color:`#000`},{name:`Brand`,slug:`brand`,color:`#0073aa`}],value:`#000`,selectedSlug:`dark-text`}},f={render:e=>(0,o.jsx)(`div`,{style:{"--red":`#f00`,"--yellow":`#ff0`,"--blue":`#00f`},children:(0,o.jsx)(Template,{...e})}),args:{colors:[{name:`Red`,color:`var(--red)`},{name:`Yellow`,color:`var(--yellow)`},{name:`Blue`,color:`var(--blue)`}]}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: Template,
  args: {
    colors: [{
      name: 'Red',
      color: '#f00'
    }, {
      name: 'White',
      color: '#fff'
    }, {
      name: 'Blue',
      color: '#00f'
    }]
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: Template,
  args: {
    colors: [{
      name: 'Red',
      color: '#f00'
    }, {
      name: 'White',
      color: '#fff'
    }, {
      name: 'Blue',
      color: '#00f'
    }],
    value: '#00f'
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  parameters: {
    // FIXME: Multiple Origins: origin groups are missing required ARIA children (aria-required-children).
    // See: https://github.com/WordPress/gutenberg/issues/81596
    a11y: {
      test: 'todo'
    }
  },
  render: Template,
  args: {
    colors: [{
      name: 'Primary colors',
      colors: [{
        name: 'Red',
        color: '#f00'
      }, {
        name: 'Yellow',
        color: '#ff0'
      }, {
        name: 'Blue',
        color: '#00f'
      }]
    }, {
      name: 'Secondary colors',
      colors: [{
        name: 'Orange',
        color: '#f60'
      }, {
        name: 'Green',
        color: '#0f0'
      }, {
        name: 'Purple',
        color: '#60f'
      }]
    }]
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: Template,
  args: {
    colors: [{
      name: 'Dark Background',
      slug: 'dark-background',
      color: '#000'
    }, {
      name: 'Dark Text',
      slug: 'dark-text',
      color: '#000'
    }, {
      name: 'Brand',
      slug: 'brand',
      color: '#0073aa'
    }],
    value: '#000',
    selectedSlug: 'dark-text'
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: args => <div style={{
    '--red': '#f00',
    '--yellow': '#ff0',
    '--blue': '#00f'
  }}>
            <Template {...args} />
        </div>,
  args: {
    colors: [{
      name: 'Red',
      color: 'var(--red)'
    }, {
      name: 'Yellow',
      color: 'var(--yellow)'
    }, {
      name: 'Blue',
      color: 'var(--blue)'
    }]
  }
}`,...f.parameters?.docs?.source}}}})))()}init_index_story();export{f as CSSVariables,c as Default,d as DuplicateColors,l as InitialValue,u as MultipleOrigins,s as default};