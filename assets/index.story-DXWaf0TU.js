import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{a,c as o,i as s,n as c,o as l,r as u,s as d,t as f}from"./root-wjitumEd.js";var p=t({CurrentOnly:()=>w,Default:()=>v,HierarchySelection:()=>C,LongLabelsAndRtl:()=>b,ResponsiveStates:()=>y,RouterLinkComposition:()=>S,default:()=>_});function ExampleTrail({ariaLabel:e=`Breadcrumbs`}){return(0,m.jsxs)(f,{"aria-label":e,children:[(0,m.jsx)(u,{href:`/`,children:`Dashboard`}),(0,m.jsx)(u,{href:`/products`,children:`Products`}),(0,m.jsx)(u,{href:`/products/themes`,children:`Themes`}),(0,m.jsx)(u,{href:`/products/themes/twentytwentyfive`,children:`Twenty Twenty-Five`}),(0,m.jsx)(a,{children:`Style variations`})]})}var m,h,g,_,v,y,b,x,S,C,w;function init_index_story(){return(init_index_story=e((()=>{r(),c(),s(),o(),l(),m=n(),{expect:h,waitFor:g}=__STORYBOOK_MODULE_TEST__,_={title:`Components/@wordpress-ui/Breadcrumb`,id:`design-system-components-breadcrumb`,component:f,subcomponents:{"Breadcrumb.LinkItem":u,"Breadcrumb.ButtonItem":d,"Breadcrumb.CurrentItem":a},argTypes:{children:{control:!1}},parameters:{componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:`Responsive overflow uses the new Menu component, which is also currently marked use-with-caution.`}}},v={render:()=>(0,m.jsx)(ExampleTrail,{})},y={render:()=>(0,m.jsx)(`div`,{style:{display:`grid`,gap:`var(--wpds-dimension-gap-lg, 16px)`},children:[760,420,260,120].map(e=>(0,m.jsx)(`div`,{style:{inlineSize:e,maxInlineSize:`100%`},children:(0,m.jsx)(ExampleTrail,{ariaLabel:`Breadcrumbs at ${e} pixels`})},e))}),play:async({canvasElement:e})=>{await g(()=>{let t=e.querySelectorAll(`ol a, ol button, ol [aria-current="page"][tabindex="0"]`);h(t.length).toBeGreaterThan(0);for(let e of t){e.focus(),h(e).toHaveFocus();let t=e.getBoundingClientRect(),n=e.closest(`ol`),r=getComputedStyle(e),i=Number.parseFloat(r.outlineWidth)+Number.parseFloat(r.outlineOffset);if(h(n).not.toBeNull(),!n)continue;let a=n.getBoundingClientRect();e.tagName===`BUTTON`&&(h(t.height).toBe(24),h(t.width).toBeGreaterThanOrEqual(24)),h(a.height).toBe(32),h(i).toBeGreaterThan(0),h(t.top-i).toBeGreaterThanOrEqual(a.top),h(t.bottom+i).toBeLessThanOrEqual(a.bottom),h(t.left-i).toBeGreaterThanOrEqual(a.left),h(t.right+i).toBeLessThanOrEqual(a.right)}})}},b={render:()=>(0,m.jsx)(`div`,{dir:`rtl`,style:{inlineSize:420,maxInlineSize:`100%`},children:(0,m.jsxs)(f,{"aria-label":`مسار التنقل`,children:[(0,m.jsx)(u,{href:`/`,children:`لوحة التحكم`}),(0,m.jsx)(u,{href:`/appearance`,children:`المظهر وإعدادات التخصيص`}),(0,m.jsx)(u,{href:`/appearance/themes`,children:`القوالب المثبتة على هذا الموقع`}),(0,m.jsx)(a,{children:`إعدادات القالب الحالي وتخصيص أنماط العرض`})]})})},x=(0,i.forwardRef)(function UnforwardedRouterLink({children:e,...t},n){return(0,m.jsx)(`a`,{...t,ref:n,"data-router-link":!0,children:e})}),S={render:()=>(0,m.jsxs)(f,{children:[(0,m.jsx)(u,{href:`/`,render:(0,m.jsx)(x,{}),children:`Dashboard`}),(0,m.jsx)(u,{href:`/settings?section=writing#defaults`,render:(0,m.jsx)(x,{}),children:`Writing settings`}),(0,m.jsx)(a,{children:`Defaults`})]})},C={render:function SelectionExample(){let[e,t]=(0,i.useState)(2),n=[`Document`,`Group`,`Paragraph`];return(0,m.jsxs)(f,{"aria-label":`Block hierarchy`,children:[n.slice(0,e).map((e,n)=>(0,m.jsx)(d,{onClick:()=>t(n),children:e},e)),(0,m.jsx)(a,{"aria-current":`true`,children:n[e]})]})}},w={render:()=>(0,m.jsxs)(m.Fragment,{children:[(0,m.jsx)(f,{"aria-label":`Page hierarchy`,children:(0,m.jsx)(a,{children:`Dashboard`})}),(0,m.jsx)(f,{"aria-label":`Block hierarchy`,children:(0,m.jsx)(a,{"aria-current":`true`,children:`Document`})})]})};try{y.__docgenInfo={description:`Each example contains the same complete trail. The component measures its
available inline size and progressively moves ancestors into the overflow
menu. Resize the canvas to see it respond continuously.`,displayName:`ResponsiveStates`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/breadcrumb/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{C.__docgenInfo={description:`Use button ancestors to select a position in a hierarchy.`,displayName:`HierarchySelection`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/breadcrumb/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <ExampleTrail />
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'grid',
    gap: 'var(--wpds-dimension-gap-lg)'
  }}>
            {[760, 420, 260, 120].map(width => <div key={width} style={{
      inlineSize: width,
      maxInlineSize: '100%'
    }}>
                    <ExampleTrail ariaLabel={\`Breadcrumbs at \${width} pixels\`} />
                </div>)}
        </div>,
  play: async ({
    canvasElement
  }) => {
    await waitFor(() => {
      const focusableItems = canvasElement.querySelectorAll<HTMLElement>('ol a, ol button, ol [aria-current="page"][tabindex="0"]');
      expect(focusableItems.length).toBeGreaterThan(0);
      for (const item of focusableItems) {
        item.focus();
        expect(item).toHaveFocus();
        const itemRect = item.getBoundingClientRect();
        const list = item.closest('ol');
        const styles = getComputedStyle(item);
        const ringSize = Number.parseFloat(styles.outlineWidth) + Number.parseFloat(styles.outlineOffset);
        expect(list).not.toBeNull();
        if (!list) {
          continue;
        }
        const listRect = list.getBoundingClientRect();
        if (item.tagName === 'BUTTON') {
          expect(itemRect.height).toBe(24);
          expect(itemRect.width).toBeGreaterThanOrEqual(24);
        }
        expect(listRect.height).toBe(32);
        expect(ringSize).toBeGreaterThan(0);
        expect(itemRect.top - ringSize).toBeGreaterThanOrEqual(listRect.top);
        expect(itemRect.bottom + ringSize).toBeLessThanOrEqual(listRect.bottom);
        expect(itemRect.left - ringSize).toBeGreaterThanOrEqual(listRect.left);
        expect(itemRect.right + ringSize).toBeLessThanOrEqual(listRect.right);
      }
    });
  }
}`,...y.parameters?.docs?.source},description:{story:`Each example contains the same complete trail. The component measures its
available inline size and progressively moves ancestors into the overflow
menu. Resize the canvas to see it respond continuously.`,...y.parameters?.docs?.description}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => <div dir="rtl" style={{
    inlineSize: 420,
    maxInlineSize: '100%'
  }}>
            <Breadcrumb.Root aria-label="مسار التنقل">
                <Breadcrumb.LinkItem href="/">لوحة التحكم</Breadcrumb.LinkItem>
                <Breadcrumb.LinkItem href="/appearance">
                    المظهر وإعدادات التخصيص
                </Breadcrumb.LinkItem>
                <Breadcrumb.LinkItem href="/appearance/themes">
                    القوالب المثبتة على هذا الموقع
                </Breadcrumb.LinkItem>
                <Breadcrumb.CurrentItem>
                    إعدادات القالب الحالي وتخصيص أنماط العرض
                </Breadcrumb.CurrentItem>
            </Breadcrumb.Root>
        </div>
}`,...b.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => <Breadcrumb.Root>
            <Breadcrumb.LinkItem href="/" render={<RouterLink />}>
                Dashboard
            </Breadcrumb.LinkItem>
            <Breadcrumb.LinkItem href="/settings?section=writing#defaults" render={<RouterLink />}>
                Writing settings
            </Breadcrumb.LinkItem>
            <Breadcrumb.CurrentItem>Defaults</Breadcrumb.CurrentItem>
        </Breadcrumb.Root>
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: function SelectionExample() {
    const [selectedIndex, setSelectedIndex] = useState(2);
    const labels = ['Document', 'Group', 'Paragraph'];
    return <Breadcrumb.Root aria-label="Block hierarchy">
                {labels.slice(0, selectedIndex).map((label, index) => <Breadcrumb.ButtonItem key={label} onClick={() => setSelectedIndex(index)}>
                        {label}
                    </Breadcrumb.ButtonItem>)}
                <Breadcrumb.CurrentItem aria-current="true">
                    {labels[selectedIndex]}
                </Breadcrumb.CurrentItem>
            </Breadcrumb.Root>;
  }
}`,...C.parameters?.docs?.source},description:{story:`Use button ancestors to select a position in a hierarchy.`,...C.parameters?.docs?.description}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => <>
            <Breadcrumb.Root aria-label="Page hierarchy">
                <Breadcrumb.CurrentItem>Dashboard</Breadcrumb.CurrentItem>
            </Breadcrumb.Root>
            <Breadcrumb.Root aria-label="Block hierarchy">
                <Breadcrumb.CurrentItem aria-current="true">
                    Document
                </Breadcrumb.CurrentItem>
            </Breadcrumb.Root>
        </>
}`,...w.parameters?.docs?.source}}}})))()}export{init_index_story as i,v as n,p as r,w as t};