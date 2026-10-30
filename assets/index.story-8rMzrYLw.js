import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./build-module-HHKy9azc.js";import{o,r as s}from"./use-context-system-CT9ido3G.js";import{n as c,t as l}from"./component-lXS83C_h.js";import{n as u,r as d}from"./component-BlLbJPf0.js";function UnconnectedDeprecatedScrollable(e,t){return a(`wp.components.__experimentalScrollable`,{since:`7.2`,version:`7.4`}),u(e,t)}var f;function init_deprecated(){return(init_deprecated=e((()=>{i(),o(),d(),f=s(UnconnectedDeprecatedScrollable,`Scrollable`)})))()}var p,m,Template,h;function init_index_story(){return(init_index_story=e((()=>{n(),c(),init_deprecated(),p=t(),m={component:f,title:`Components/@wordpress-components/Deprecated/Scrollable`,id:`components-scrollable`,argTypes:{as:{control:{type:`text`}},children:{control:!1}},tags:[`status-experimental`],parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:`Deprecated. Write your own CSS instead.`}}},Template=({...e})=>{let t=(0,r.useRef)(null),onButtonClick=()=>{t.current?.focus()};return(0,p.jsx)(f,{style:{height:400,width:300},...e,children:(0,p.jsxs)(l,{style:{backgroundColor:`#eee`,height:e.scrollDirection===`x`?400:1e3,width:e.scrollDirection===`y`?300:1e3,position:`relative`},children:[(0,p.jsx)(`button`,{onClick:onButtonClick,children:`Move focus to an element out of view`}),(0,p.jsx)(`input`,{ref:t,style:{position:`absolute`,bottom:e.scrollDirection===`x`?`initial`:0,right:0},type:`text`,"aria-label":`Element out of view`,value:`Focus me`,readOnly:!0})]})})},h=Template.bind({}),h.args={smoothScroll:!1,scrollDirection:`y`},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`({
  ...args
}) => {
  const targetRef = useRef<HTMLInputElement>(null);
  const onButtonClick = () => {
    targetRef.current?.focus();
  };
  const containerWidth = 300;
  const containerHeight = 400;
  return <Scrollable style={{
    height: containerHeight,
    width: containerWidth
  }} {...args}>
            <View style={{
      backgroundColor: '#eee',
      height: args.scrollDirection === 'x' ? containerHeight : 1000,
      width: args.scrollDirection === 'y' ? containerWidth : 1000,
      position: 'relative'
    }}>
                <button onClick={onButtonClick}>
                    Move focus to an element out of view
                </button>
                <input ref={targetRef} style={{
        position: 'absolute',
        bottom: args.scrollDirection === 'x' ? 'initial' : 0,
        right: 0
      }} type="text" aria-label="Element out of view" value="Focus me" readOnly />
            </View>
        </Scrollable>;
}`,...h.parameters?.docs?.source}}}})))()}init_index_story();export{h as Default,m as default};