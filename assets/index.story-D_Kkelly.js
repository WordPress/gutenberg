import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{J as n,Y as r}from"./build-module-BI5KqeYf.js";import{At as i,J as a,Y as o,jt as s}from"./utils-2-5U2Wyg.js";import{n as c,t as l}from"./build-module-B-NVlLhQ.js";var u,d,f;function init_fixtures(){return(init_fixtures=e((()=>{u=[{categories:[`featured`,`text`],content:`<!-- wp:heading {"align":"wide","style":{"typography":{"fontSize":"48px","lineHeight":"1.1"}}} -->
<h2 class="alignwide" id="we-re-a-studio-in-berlin-with-an-international-practice-in-architecture-urban-planning-and-interior-design-we-believe-in-sharing-knowledge-and-promoting-dialogue-to-increase-the-creative-potential-of-collaboration" style="font-size:48px;line-height:1.1">We're a studio in Berlin with an international practice in architecture, urban planning and interior design. We believe in sharing knowledge and promoting dialogue to increase the creative potential of collaboration.</h2>
<!-- /wp:heading -->`,description:`Heading text`,keywords:[`large text`,`title`],name:`heading`,title:`Heading`}],d=[{name:`featured`,label:`Featured`},{name:`text`,label:`Text`}],f=[{content:{raw:`<!-- wp:paragraph -->
<p>This is reusable</p>
<!-- /wp:paragraph -->`,protected:!1,block_version:1},date:`2022-09-12T13:28:06`,date_gmt:`2022-09-12T13:28:06`,id:70,link:`http://localhost:8888/?p=70`,modified:`2022-09-12T13:28:06`,modified_gmt:`2022-09-12T13:28:06`,password:``,slug:`simple-paragraph`,status:`publish`,template:``,title:{raw:`Simple paragraph`},type:`wp_block`}]})))()}var p,m,h,LibraryWithoutPatterns,LibraryWithPatterns,LibraryWithPatternsAndReusableBlocks,FullInserter,QuickInserter;function init_index_story(){return(init_index_story=e((()=>{l(),n(),s(),init_fixtures(),o(),p=t(),m={id:`blockeditor-inserter`,title:`Editor/Block Editor/Inserter`},c(),h={margin:`24px`,height:400,border:`1px solid #f3f3f3`,display:`inline-block`},LibraryWithoutPatterns=()=>(0,p.jsx)(i,{children:(0,p.jsx)(`div`,{style:h,children:(0,p.jsx)(r,{showInserterHelpPanel:!0})})}),LibraryWithPatterns=()=>(0,p.jsx)(i,{settings:{__experimentalBlockPatternCategories:d,__experimentalBlockPatterns:u},children:(0,p.jsx)(`div`,{style:h,children:(0,p.jsx)(r,{showInserterHelpPanel:!0})})}),LibraryWithPatternsAndReusableBlocks=()=>(0,p.jsx)(i,{settings:{__experimentalBlockPatternCategories:d,__experimentalBlockPatterns:u,__experimentalReusableBlocks:f},children:(0,p.jsx)(`div`,{style:h,children:(0,p.jsx)(r,{showInserterHelpPanel:!0})})}),FullInserter=()=>(0,p.jsx)(i,{settings:{__experimentalBlockPatternCategories:d,__experimentalBlockPatterns:u,__experimentalReusableBlocks:f},children:(0,p.jsx)(`div`,{style:h,children:(0,p.jsx)(a,{})})}),QuickInserter=()=>(0,p.jsx)(i,{settings:{__experimentalBlockPatternCategories:d,__experimentalBlockPatterns:u,__experimentalReusableBlocks:f},children:(0,p.jsx)(`div`,{style:h,children:(0,p.jsx)(a,{__experimentalIsQuick:!0})})}),LibraryWithoutPatterns.parameters={...LibraryWithoutPatterns.parameters,docs:{...LibraryWithoutPatterns.parameters?.docs,source:{originalSource:`() => {
  return <ExperimentalBlockEditorProvider>
            <div style={wrapperStyle}>
                <BlockLibrary showInserterHelpPanel />
            </div>
        </ExperimentalBlockEditorProvider>;
}`,...LibraryWithoutPatterns.parameters?.docs?.source}}},LibraryWithPatterns.parameters={...LibraryWithPatterns.parameters,docs:{...LibraryWithPatterns.parameters?.docs,source:{originalSource:`() => {
  return <ExperimentalBlockEditorProvider settings={{
    __experimentalBlockPatternCategories: patternCategories,
    __experimentalBlockPatterns: patterns
  }}>
            <div style={wrapperStyle}>
                <BlockLibrary showInserterHelpPanel />
            </div>
        </ExperimentalBlockEditorProvider>;
}`,...LibraryWithPatterns.parameters?.docs?.source}}},LibraryWithPatternsAndReusableBlocks.parameters={...LibraryWithPatternsAndReusableBlocks.parameters,docs:{...LibraryWithPatternsAndReusableBlocks.parameters?.docs,source:{originalSource:`() => {
  return <ExperimentalBlockEditorProvider settings={{
    __experimentalBlockPatternCategories: patternCategories,
    __experimentalBlockPatterns: patterns,
    __experimentalReusableBlocks: reusableBlocks
  }}>
            <div style={wrapperStyle}>
                <BlockLibrary showInserterHelpPanel />
            </div>
        </ExperimentalBlockEditorProvider>;
}`,...LibraryWithPatternsAndReusableBlocks.parameters?.docs?.source}}},FullInserter.parameters={...FullInserter.parameters,docs:{...FullInserter.parameters?.docs,source:{originalSource:`() => {
  return <ExperimentalBlockEditorProvider settings={{
    __experimentalBlockPatternCategories: patternCategories,
    __experimentalBlockPatterns: patterns,
    __experimentalReusableBlocks: reusableBlocks
  }}>
            <div style={wrapperStyle}>
                <Inserter />
            </div>
        </ExperimentalBlockEditorProvider>;
}`,...FullInserter.parameters?.docs?.source}}},QuickInserter.parameters={...QuickInserter.parameters,docs:{...QuickInserter.parameters?.docs,source:{originalSource:`() => {
  return <ExperimentalBlockEditorProvider settings={{
    __experimentalBlockPatternCategories: patternCategories,
    __experimentalBlockPatterns: patterns,
    __experimentalReusableBlocks: reusableBlocks
  }}>
            <div style={wrapperStyle}>
                <Inserter __experimentalIsQuick />
            </div>
        </ExperimentalBlockEditorProvider>;
}`,...QuickInserter.parameters?.docs?.source}}}})))()}init_index_story();export{FullInserter,LibraryWithPatterns,LibraryWithPatternsAndReusableBlocks,LibraryWithoutPatterns,QuickInserter,m as default};