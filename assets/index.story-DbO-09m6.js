import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./gradient-picker-BPe5GDdw.js";var o,s,c,l,Template,u,d,f,p,m;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),{fn:s}=__STORYBOOK_MODULE_TEST__,c={tags:[`manifest`],title:`Components/@wordpress-components/Selection & Input/Color/GradientPicker`,id:`components-gradientpicker`,component:a,parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`global`}},args:{onChange:s()},argTypes:{selectedSlug:{control:!1},value:{control:!1}}},l=[{name:`Vivid cyan blue to vivid purple`,gradient:`linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)`,slug:`vivid-cyan-blue-to-vivid-purple`},{name:`Light green cyan to vivid green cyan`,gradient:`linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)`,slug:`light-green-cyan-to-vivid-green-cyan`},{name:`Luminous vivid amber to luminous vivid orange`,gradient:`linear-gradient(135deg,rgba(252,185,0,1) 0%,rgba(255,105,0,1) 100%)`,slug:`luminous-vivid-amber-to-luminous-vivid-orange`},{name:`Luminous vivid orange to vivid red`,gradient:`linear-gradient(135deg,rgba(255,105,0,1) 0%,rgb(207,46,46) 100%)`,slug:`luminous-vivid-orange-to-vivid-red`},{name:`Very light gray to cyan bluish gray`,gradient:`linear-gradient(135deg,rgb(238,238,238) 0%,rgb(169,184,195) 100%)`,slug:`very-light-gray-to-cyan-bluish-gray`},{name:`Cool to warm spectrum`,gradient:`linear-gradient(135deg,rgb(74,234,220) 0%,rgb(151,120,209) 20%,rgb(207,42,186) 40%,rgb(238,44,130) 60%,rgb(251,105,98) 80%,rgb(254,248,76) 100%)`,slug:`cool-to-warm-spectrum`},{name:`HSL blue to purple`,gradient:`linear-gradient(135deg,hsl(200, 100%, 50%) 0%,hsl(280, 100%, 60%) 100%)`,slug:`hsl-blue-to-purple`},{name:`HSLA green to red`,gradient:`linear-gradient(135deg,hsla(120, 100%, 40%, 0.85) 0%,hsla(0, 100%, 50%, 0.85) 100%)`,slug:`hsla-green-to-red`}],Template=({onChange:e,value:t,selectedSlug:n,...i})=>{let[s,c]=(0,r.useState)(t??null),[l,u]=(0,r.useState)(n);return(0,o.jsx)(a,{...i,value:s,selectedSlug:l,onChange:(t,n,r)=>{c(t),u(r),e?.(t,n,r)}})},u={render:Template,args:{gradients:l}},d={render:Template,args:{gradients:[]}},f={render:Template,args:{gradients:[{name:`Dark Background`,slug:`dark-background`,gradient:`linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)`},{name:`Dark Text`,slug:`dark-text`,gradient:`linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)`},{name:`Brand`,slug:`brand`,gradient:`linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)`}],value:`linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)`,selectedSlug:`dark-text`,disableCustomGradients:!0}},p={parameters:{a11y:{test:`todo`}},render:Template,args:{gradients:[{name:`Origin 1`,gradients:l},{name:`Origin 2`,gradients:l}]}},m={render:e=>(0,o.jsx)(`div`,{style:{"--red":`#f00`,"--yellow":`#ff0`,"--blue":`#00f`},children:(0,o.jsx)(Template,{...e})}),args:{gradients:[{name:`Red to Yellow`,gradient:`linear-gradient(135deg,var(--red) 0%,var(--yellow) 100%)`,slug:`red-to-yellow`},{name:`Yellow to Blue`,gradient:`linear-gradient(135deg,var(--yellow) 0%,var(--blue) 100%)`,slug:`yellow-to-blue`},{name:`Blue to Red`,gradient:`linear-gradient(135deg,var(--blue) 0%,var(--red) 100%)`,slug:`blue-to-red`}]}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: Template,
  args: {
    gradients: GRADIENTS
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: Template,
  args: {
    gradients: []
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: Template,
  args: {
    gradients: [{
      name: 'Dark Background',
      slug: 'dark-background',
      gradient: 'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)'
    }, {
      name: 'Dark Text',
      slug: 'dark-text',
      gradient: 'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)'
    }, {
      name: 'Brand',
      slug: 'brand',
      gradient: 'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)'
    }],
    value: 'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
    selectedSlug: 'dark-text',
    disableCustomGradients: true
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  parameters: {
    // FIXME: Multiple Origins: origin groups are missing required ARIA children (aria-required-children).
    // See: https://github.com/WordPress/gutenberg/issues/81596
    a11y: {
      test: 'todo'
    }
  },
  render: Template,
  args: {
    gradients: [{
      name: 'Origin 1',
      gradients: GRADIENTS
    }, {
      name: 'Origin 2',
      gradients: GRADIENTS
    }]
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: args => <div style={{
    '--red': '#f00',
    '--yellow': '#ff0',
    '--blue': '#00f'
  }}>
            <Template {...args} />
        </div>,
  args: {
    gradients: [{
      name: 'Red to Yellow',
      gradient: 'linear-gradient(135deg,var(--red) 0%,var(--yellow) 100%)',
      slug: 'red-to-yellow'
    }, {
      name: 'Yellow to Blue',
      gradient: 'linear-gradient(135deg,var(--yellow) 0%,var(--blue) 100%)',
      slug: 'yellow-to-blue'
    }, {
      name: 'Blue to Red',
      gradient: 'linear-gradient(135deg,var(--blue) 0%,var(--red) 100%)',
      slug: 'blue-to-red'
    }]
  }
}`,...m.parameters?.docs?.source}}}})))()}init_index_story();export{m as CSSVariables,u as Default,f as DuplicateGradients,p as MultipleOrigins,d as WithNoExistingGradients,c as default};