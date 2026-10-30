import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./menu-BzznTuW1.js";import{n as o,t as s}from"./menu-group-DP9smo1n.js";import{n as c,t as l}from"./menu-items-choice-ImSKz7jO.js";var u,d,Template,f;function init_index_story(){return(init_index_story=e((()=>{n(),c(),o(),i(),u=t(),d={tags:[`manifest`],component:l,title:`Components/@wordpress-components/Actions/MenuItemsChoice`,id:`components-menuitemschoice`,argTypes:{onHover:{action:`onHover`},onSelect:{action:`onSelect`},value:{control:!1}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`global`,notes:"Subcomponent of `DropdownMenu`."}}},Template=({onHover:e,onSelect:t,choices:n})=>{let[i,o]=(0,r.useState)(n[0]?.value??``);return(0,u.jsx)(a,{children:(0,u.jsx)(s,{label:`Editor`,children:(0,u.jsx)(l,{choices:n,value:i,onSelect:(...e)=>{t(...e),o(...e)},onHover:e})})})},f=Template.bind({}),f.args={choices:[{value:`arbitrary-choice-1`,label:`Arbitrary Label #1`,info:`Arbitrary Explanatory 1`},{value:`arbitrary-choice-2`,label:`Arbitrary Label #2`,info:`Arbitrary Explanatory 2`},{value:`arbitrary-choice-3`,label:`Arbitrary Label #3`,info:`Arbitrary Explanatory 3`}],value:`arbitrary-choice-1`},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`({
  onHover,
  onSelect,
  choices
}) => {
  const [choice, setChoice] = useState(choices[0]?.value ?? '');
  return <NavigableMenu>
            <MenuGroup label="Editor">
                <MenuItemsChoice choices={choices} value={choice} onSelect={(...selectArgs) => {
        onSelect(...selectArgs);
        setChoice(...selectArgs);
      }} onHover={onHover} />
            </MenuGroup>
        </NavigableMenu>;
}`,...f.parameters?.docs?.source}}}})))()}init_index_story();export{f as Default,d as default};