import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{do as i,n as a}from"./build-module-CPA2Y5FH.js";import{n as o,t as s}from"./input-control-DURX3pnl.js";import{n as c,t as l}from"./button-8ccnOjTA.js";import{n as u,t as d}from"./modal-CJZ_Y3ll.js";var f,p,Template,m,h,g;function init_index_story(){return(init_index_story=e((()=>{n(),a(),c(),o(),u(),f=t(),p={tags:[`manifest`],component:d,title:`Components/@wordpress-components/Overlays/Modal`,id:`components-modal`,argTypes:{children:{control:!1},onKeyDown:{control:!1},focusOnMount:{options:[!0,!1,`firstElement`,`firstContentElement`],control:{type:`select`}},role:{control:{type:`text`}},onRequestClose:{action:`onRequestClose`},isDismissible:{control:{type:`boolean`}}},parameters:{controls:{expanded:!0},componentStatus:{status:`recommended`,whereUsed:`global`,notes:"Will be superseded by [`Dialog`](?path=/docs/design-system-components-dialog--docs) in `@wordpress/ui`, but continue using for now."}}},Template=({onRequestClose:e,...t})=>{let[n,i]=(0,r.useState)(!1),openModal=()=>i(!0),closeModal=t=>{i(!1),e(t)};return(0,f.jsxs)(f.Fragment,{children:[(0,f.jsx)(l,{__next40pxDefaultSize:!0,variant:`secondary`,onClick:openModal,children:`Open Modal`}),n&&(0,f.jsxs)(d,{onRequestClose:closeModal,...t,children:[(0,f.jsx)(`p`,{children:`Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`}),(0,f.jsx)(s,{style:{marginBottom:`20px`}}),(0,f.jsx)(l,{__next40pxDefaultSize:!0,variant:`secondary`,onClick:closeModal,children:`Close Modal`})]})]})},m=Template.bind({}),m.args={title:`Title`},m.parameters={docs:{source:{code:``}}},h=Template.bind({}),h.args={size:`small`},h.storyName=`With size: small`,g=Template.bind({}),g.args={...m.args,headerActions:(0,f.jsx)(l,{icon:i,label:`Fullscreen mode`,size:`compact`}),children:(0,f.jsx)(`div`,{style:{height:`200px`}})},g.parameters={...m.parameters};try{g.__docgenInfo={description:"The `headerActions` prop can be used to add auxiliary actions to the header, for example a fullscreen mode toggle.",displayName:`WithHeaderActions`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/modal/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`({
  onRequestClose,
  ...args
}) => {
  const [isOpen, setOpen] = useState(false);
  const openModal = () => setOpen(true);
  const closeModal: ModalProps['onRequestClose'] = event => {
    setOpen(false);
    onRequestClose(event);
  };
  return <>
            <Button __next40pxDefaultSize variant="secondary" onClick={openModal}>
                Open Modal
            </Button>
            {isOpen && <Modal onRequestClose={closeModal} {...args}>
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et magna
                        aliqua. Ut enim ad minim veniam, quis nostrud
                        exercitation ullamco laboris nisi ut aliquip ex ea ea
                        commodo consequat. Duis aute irure dolor in
                        reprehenderit in voluptate velit esse cillum dolore eu
                        fugiat nulla pariatur. Excepteur sint occaecat cupidatat
                        non proident, sunt in culpa qui officia deserunt mollit
                        anim id est laborum.
                    </p>

                    <InputControl style={{
        marginBottom: '20px'
      }} />

                    <Button __next40pxDefaultSize variant="secondary" onClick={closeModal}>
                        Close Modal
                    </Button>
                </Modal>}
        </>;
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`({
  onRequestClose,
  ...args
}) => {
  const [isOpen, setOpen] = useState(false);
  const openModal = () => setOpen(true);
  const closeModal: ModalProps['onRequestClose'] = event => {
    setOpen(false);
    onRequestClose(event);
  };
  return <>
            <Button __next40pxDefaultSize variant="secondary" onClick={openModal}>
                Open Modal
            </Button>
            {isOpen && <Modal onRequestClose={closeModal} {...args}>
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et magna
                        aliqua. Ut enim ad minim veniam, quis nostrud
                        exercitation ullamco laboris nisi ut aliquip ex ea ea
                        commodo consequat. Duis aute irure dolor in
                        reprehenderit in voluptate velit esse cillum dolore eu
                        fugiat nulla pariatur. Excepteur sint occaecat cupidatat
                        non proident, sunt in culpa qui officia deserunt mollit
                        anim id est laborum.
                    </p>

                    <InputControl style={{
        marginBottom: '20px'
      }} />

                    <Button __next40pxDefaultSize variant="secondary" onClick={closeModal}>
                        Close Modal
                    </Button>
                </Modal>}
        </>;
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`({
  onRequestClose,
  ...args
}) => {
  const [isOpen, setOpen] = useState(false);
  const openModal = () => setOpen(true);
  const closeModal: ModalProps['onRequestClose'] = event => {
    setOpen(false);
    onRequestClose(event);
  };
  return <>
            <Button __next40pxDefaultSize variant="secondary" onClick={openModal}>
                Open Modal
            </Button>
            {isOpen && <Modal onRequestClose={closeModal} {...args}>
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et magna
                        aliqua. Ut enim ad minim veniam, quis nostrud
                        exercitation ullamco laboris nisi ut aliquip ex ea ea
                        commodo consequat. Duis aute irure dolor in
                        reprehenderit in voluptate velit esse cillum dolore eu
                        fugiat nulla pariatur. Excepteur sint occaecat cupidatat
                        non proident, sunt in culpa qui officia deserunt mollit
                        anim id est laborum.
                    </p>

                    <InputControl style={{
        marginBottom: '20px'
      }} />

                    <Button __next40pxDefaultSize variant="secondary" onClick={closeModal}>
                        Close Modal
                    </Button>
                </Modal>}
        </>;
}`,...g.parameters?.docs?.source},description:{story:"The `headerActions` prop can be used to add auxiliary actions to the header, for example a fullscreen mode toggle.",...g.parameters?.docs?.description}}}})))()}init_index_story();export{m as Default,g as WithHeaderActions,h as WithsizeSmall,p as default};