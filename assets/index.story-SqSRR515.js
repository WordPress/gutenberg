import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{Tt as i,cn as a,n as o,t as s}from"./store-CqttlGuP.js";import{Mt as c,Nt as l}from"./build-module-DcXuoy9a.js";import{m as u,n as d}from"./build-module-CRw_t1T3.js";import{At as f,jt as p}from"./utils-D9p7k-Cw.js";import{n as m,t as h}from"./build-module-CPfkM_W9.js";import{H as g,U as _}from"./utils-B7CgBQoQ.js";var v,y,b,x,S,C;function init_index_story(){return(init_index_story=e((()=>{n(),i(),h(),d(),_(),l(),p(),s(),v=t(),m(),y=[a(`core/group`,{layout:{type:`flex`}},[a(`core/paragraph`),a(`core/paragraph`),a(`core/paragraph`)]),a(`core/buttons`,{},[a(`core/button`),a(`core/button`),a(`core/button`)])],b={id:`blockeditor-blockmover`,title:`Editor/Block Editor/BlockMover`,component:c,parameters:{docs:{canvas:{sourceState:`shown`},description:{component:`BlockMover component allows moving blocks inside the editor using up and down buttons.`}}},decorators:[e=>(0,v.jsx)(f,{value:y,children:(0,v.jsx)(g,{label:`Block Mover`,children:(0,v.jsx)(e,{})})})],argTypes:{clientIds:{control:{type:`none`},description:`The client IDs of the blocks to move.`},hideDragHandle:{control:{type:`boolean`},description:`If this property is true, the drag handle is hidden.`}}},x={args:{clientIds:[y[0].innerBlocks[1].clientId]}},S={decorators:[e=>{let{updateBlockListSettings:t}=u(o);return(0,r.useEffect)(()=>{t(y[1].clientId,{orientation:`horizontal`})},[]),(0,v.jsx)(e,{})}],args:{clientIds:[y[1].innerBlocks[1].clientId]},parameters:{docs:{canvas:{sourceState:`hidden`}}}},C={args:{...x.args,hideDragHandle:!0}};try{b.__docgenInfo={description:``,displayName:`BlockMover`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/block-editor/src/components/block-mover/stories/index.story.tsx`,methods:[],props:{clientIds:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/block-editor/src/components/block-mover/types.ts`,name:`BlockMoverProps`}],description:`The client IDs of the blocks to move.`,name:`clientIds`,parent:{fileName:`gutenberg/packages/block-editor/src/components/block-mover/types.ts`,name:`BlockMoverProps`},required:!0,tags:{},type:{name:`string[]`}},hideDragHandle:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/block-editor/src/components/block-mover/types.ts`,name:`BlockMoverProps`}],description:`If this property is true, the drag handle is hidden.`,name:`hideDragHandle`,parent:{fileName:`gutenberg/packages/block-editor/src/components/block-mover/types.ts`,name:`BlockMoverProps`},required:!1,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}try{S.__docgenInfo={description:`This story shows the block mover with horizontal orientation.
It is necessary to render the blocks to update the block settings in the state.`,displayName:`Horizontal`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/block-editor/src/components/block-mover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{C.__docgenInfo={description:"You can hide the drag handle by `hideDragHandle` attribute.",displayName:`HideDragHandle`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/block-editor/src/components/block-mover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    clientIds: [blocks[0].innerBlocks[1].clientId]
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    const {
      updateBlockListSettings
    } = useDispatch(blockEditorStore);
    useEffect(() => {
      /**
       * This shouldn't be needed but unfortunately
       * the layout orientation is not declarative, we need
       * to render the blocks to update the block settings in the state.
       */
      updateBlockListSettings(blocks[1].clientId, {
        orientation: 'horizontal'
      });
    }, []);
    return <Story />;
  }],
  args: {
    clientIds: [blocks[1].innerBlocks[1].clientId]
  },
  parameters: {
    docs: {
      canvas: {
        sourceState: 'hidden'
      }
    }
  }
}`,...S.parameters?.docs?.source},description:{story:`This story shows the block mover with horizontal orientation.
It is necessary to render the blocks to update the block settings in the state.`,...S.parameters?.docs?.description}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    hideDragHandle: true
  }
}`,...C.parameters?.docs?.source},description:{story:"You can hide the drag handle by `hideDragHandle` attribute.",...C.parameters?.docs?.description}}}})))()}init_index_story();export{x as Default,C as HideDragHandle,S as Horizontal,b as default};