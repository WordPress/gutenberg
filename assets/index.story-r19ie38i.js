import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{En as i,In as a,Tt as o,cn as s}from"./store-BhNPWe19.js";import{At as c,Rt as l,S as u,b as d,jt as f,x as p,y as m,zt as h}from"./utils-2-5U2Wyg.js";function ContainerEdit(){let e=(0,r.useContext)(_),t=h();return(0,g.jsx)(`div`,{...t,children:(0,g.jsx)(p,{...e})})}function ChildEdit({name:e}){let t=h(),{title:n}=i(e);return(0,g.jsx)(`p`,{...t,children:n})}function useContainerBlock(){return(0,r.useMemo)(()=>(b.forEach(([e,t,n])=>{i(e)||a(e,{apiVersion:3,title:t,category:n,attributes:{},edit:ChildEdit,save:()=>null})}),i(v)||a(v,{apiVersion:3,title:`Example Container`,category:`design`,supports:{inserter:!1},attributes:{},edit:ContainerEdit,save:()=>null}),[{...s(v),clientId:x}]),[])}var g,_,v,y,b,x,S,C,w,T;function init_index_story(){return(init_index_story=e((()=>{o(),n(),u(),d(),l(),f(),g=t(),_=(0,r.createContext)({}),v=`storybook/inner-blocks-container`,y=`storybook/example-text`,b=[[y,`Example Text`,`text`],[`storybook/example-media`,`Example Media`,`media`]],x=`inner-blocks-container`,S={selectionStart:{clientId:x},selectionEnd:{clientId:x}},C=`
    .inner-blocks-story .wp-block[data-type="${v}"] {
        border: 1px dashed #949494;
        padding: 16px;
    }
`,w={id:`blockeditor-innerblocks`,title:`Editor/Block Editor/InnerBlocks`,component:p,parameters:{docs:{canvas:{sourceState:`shown`},description:{component:"InnerBlocks is a component which allows a single block to have multiple blocks as children. It is rendered by a block `edit` implementation, and pairs with `InnerBlocks.Content` in the `save` implementation, which is replaced by the content of the nested blocks."},source:{code:`registerBlockType( 'my-plugin/my-block', {
    edit() {
        const blockProps = useBlockProps();

        return (
            <div { ...blockProps }>
                <InnerBlocks
                    allowedBlocks={ [ 'core/image', 'core/paragraph' ] }
                    orientation="vertical"
                    renderAppender={ InnerBlocks.ButtonBlockAppender }
                />
            </div>
        );
    },

    save() {
        const blockProps = useBlockProps.save();

        return (
            <div { ...blockProps }>
                <InnerBlocks.Content />
            </div>
        );
    },
} );`}}},argTypes:{allowedBlocks:{control:{type:`select`},options:[`all`,`none`,`text block only`],mapping:{all:!0,none:!1,"text block only":[y]},description:"The block types that can be inserted. `true` allows every block type, `false` allows none, and an array limits insertion to the listed block types.",table:{type:{summary:`boolean | string[]`},defaultValue:{summary:`true`}}},orientation:{control:{type:`select`},options:[`vertical`,`horizontal`],description:`Whether inner blocks are shown horizontally or vertically. It does not style the inner blocks, but it orients the block movers and makes drag and drop behave accordingly.`,table:{type:{summary:`'horizontal' | 'vertical'`},defaultValue:{summary:`'vertical'`}}},templateLock:{control:{type:`select`},options:[!1,`all`,`insert`,`contentOnly`],description:"Locks the inner blocks area. `'all'` prevents all operations, `'insert'` prevents inserting and removing blocks but allows moving them, `'contentOnly'` prevents all operations and cannot be overridden by children, and `false` opts out of a lock applied by a parent. When unset, the lock of the parent inner blocks area is used.",table:{type:{summary:`boolean | 'all' | 'insert' | 'contentOnly'`}}},renderAppender:{control:{type:`select`},options:[`default`,`button`,`none`],mapping:{default:void 0,button:p.ButtonBlockAppender,none:!1},description:"The component shown as the trailing appender of the inner blocks list. `InnerBlocks.ButtonBlockAppender` and `InnerBlocks.DefaultBlockAppender` are exposed for convenience, and any valid component can be passed. `false` renders no appender, and when unset the default appender is shown.",table:{type:{summary:`Component | false`}}},defaultBlock:{control:{type:`object`},description:"The block type inserted by default, in the form `{ name, attributes }`.",table:{type:{summary:`Object`}}},directInsert:{control:{type:`boolean`},description:"Whether the appender inserts `defaultBlock` directly, skipping the inserter dropdown and any registered inserter variations of that block type.",table:{type:{summary:`boolean`}}},prioritizedInserterBlocks:{control:{type:`object`},description:"The block types shown first in the block inserter, as an array of `{blockName}/{variationName}` strings, where the variation name is optional.",table:{type:{summary:`string[]`}}},placeholder:{control:!1,description:`An element rendered in front of the appender, which can be used to represent an example state before any block is inserted.`,table:{type:{summary:`Element`}}}}},T={render:function Template(e){let t=useContainerBlock();return(0,g.jsx)(_.Provider,{value:e,children:(0,g.jsxs)(c,{value:t,selection:S,children:[(0,g.jsx)(`style`,{children:C}),(0,g.jsx)(`div`,{className:`inner-blocks-story`,children:(0,g.jsx)(m,{})})]})})}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  render: function Template(args: InnerBlocksOptions) {
    const blocks = useContainerBlock();
    return <ArgsContext.Provider value={args}>
                <ExperimentalBlockEditorProvider value={blocks} selection={SELECTION}>
                    <style>{storyStyles}</style>
                    <div className="inner-blocks-story">
                        <BlockList />
                    </div>
                </ExperimentalBlockEditorProvider>
            </ArgsContext.Provider>;
  }
}`,...T.parameters?.docs?.source}}}})))()}init_index_story();export{T as Default,w as default};