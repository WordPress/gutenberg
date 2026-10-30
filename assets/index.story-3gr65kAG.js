import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./component-lXS83C_h.js";import{n as i,t as a}from"./component-lc2omK31.js";var o,s,c,Template,l;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={top:`top`,topLeft:`topLeft`,topRight:`topRight`,left:`left`,center:`center`,right:`right`,bottom:`bottom`,bottomLeft:`bottomLeft`,bottomRight:`bottomRight`,edge:`edge`,stretch:`stretch`},c={component:a,title:`Components/@wordpress-components/Layout/VStack`,id:`components-vstack`,argTypes:{alignment:{control:{type:`select`},options:Object.keys(s),mapping:s},as:{control:{type:`text`}},direction:{control:{type:`text`}},justify:{control:{type:`text`}},spacing:{control:{type:`text`}}},tags:[`status-experimental`],parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Use [`Stack`](?path=/docs/design-system-components-stack--docs) from `@wordpress/ui` instead."}}},Template=e=>(0,o.jsx)(a,{...e,style:{background:`#eee`,minHeight:`200px`},children:[`One`,`Two`,`Three`,`Four`,`Five`].map(e=>(0,o.jsx)(r,{style:{background:`#b9f9ff`},children:e},e))}),l=Template.bind({}),l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`props => {
  return <VStack {...props} style={{
    background: '#eee',
    minHeight: '200px'
  }}>
            {['One', 'Two', 'Three', 'Four', 'Five'].map(text => <View key={text} style={{
      background: '#b9f9ff'
    }}>
                    {text}
                </View>)}
        </VStack>;
}`,...l.parameters?.docs?.source}}}})))()}init_index_story();export{l as Default,c as default};