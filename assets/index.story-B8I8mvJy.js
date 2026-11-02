import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./build-module-CqL0UdL5.js";import{n as o,oa as s}from"./build-module-CPA2Y5FH.js";import{n as c,t as l}from"./button-CwFwETKD.js";import{n as u,t as d}from"./toggle-control-DhjYRUqP.js";import{n as f,t as p}from"./url-popover-D6FmDRSx.js";var m,h,g;function init_index_story(){return(init_index_story=e((()=>{c(),u(),n(),a(),o(),f(),m=t(),h={id:`blockeditor-urlpopover`,title:`Editor/Block Editor/URLPopover`,component:p,parameters:{a11y:{test:`todo`},docs:{canvas:{sourceState:`shown`},description:{component:`Popover component used for editing and viewing URLs.`}}},argTypes:{onClose:{action:`onClose`,description:`Callback when the popover is closed.`,table:{type:{summary:`function`}}},renderSettings:{description:`Callback to render settings inside the popover.`,table:{type:{summary:`function`}},control:!1},additionalControls:{description:`Additional controls rendered below the input row. They are hidden while the settings drawer is open.`,table:{type:{summary:`Element`}},control:!1},placement:{control:{type:`select`},options:[`top`,`top-start`,`top-end`,`right`,`right-start`,`right-end`,`bottom`,`bottom-start`,`bottom-end`,`left`,`left-start`,`left-end`,`overlay`],description:`Placement of the popover relative to its parent.`,table:{type:{summary:`string`},defaultValue:{summary:`'bottom'`}}},focusOnMount:{control:{type:`select`},options:[`firstElement`,`firstInputElement`,!0,!1],description:`Controls which element is focused when the popover mounts.`,table:{type:{summary:`boolean | 'firstElement' | 'firstInputElement'`},defaultValue:{summary:`'firstElement'`}}}},args:{placement:`bottom`,focusOnMount:`firstElement`}},g={render:function Template({onClose:e,...t}){let[n,a]=(0,r.useState)(!0),[o,c]=(0,r.useState)(``),[u,f]=(0,r.useState)(!1),closePopover=()=>a(!1);return(0,m.jsxs)(m.Fragment,{children:[(0,m.jsx)(l,{__next40pxDefaultSize:!0,onClick:()=>a(!0),children:i(`Edit URL`)}),n&&(0,m.jsx)(p,{...t,onClose:(...t)=>{e(...t),closePopover()},renderSettings:()=>(0,m.jsx)(d,{label:i(`Open in new tab`),checked:u,onChange:f}),children:(0,m.jsxs)(`form`,{onSubmit:e=>{e.preventDefault(),closePopover()},children:[(0,m.jsx)(`input`,{type:`url`,placeholder:i(`Enter URL`),value:o,onChange:e=>c(e.target.value)}),(0,m.jsx)(l,{__next40pxDefaultSize:!0,icon:s,label:i(`Apply`),type:`submit`})]})})]})}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: function Template({
    onClose,
    ...args
  }) {
    const [isVisible, setIsVisible] = useState(true);
    const [url, setUrl] = useState('');
    const [isOpenInNewTab, setIsOpenInNewTab] = useState(false);

    // Close the popover.
    const closePopover = () => setIsVisible(false);
    return <>
                <Button __next40pxDefaultSize onClick={() => setIsVisible(true)}>
                    {__('Edit URL')}
                </Button>
                {isVisible && <URLPopover {...args} onClose={(...closeArgs) => {
        // The \`onClose\` action is always set.
        onClose!(...closeArgs);
        closePopover();
      }} renderSettings={() => <ToggleControl label={__('Open in new tab')} checked={isOpenInNewTab} onChange={setIsOpenInNewTab} />}>
                        <form onSubmit={e => {
          e.preventDefault();
          closePopover();
        }}>
                            <input type="url" placeholder={__('Enter URL')} value={url} onChange={e => setUrl(e.target.value)} />
                            <Button __next40pxDefaultSize icon={keyboardReturn} label={__('Apply')} type="submit" />
                        </form>
                    </URLPopover>}
            </>;
  }
}`,...g.parameters?.docs?.source}}}})))()}init_index_story();export{g as Default,h as default};