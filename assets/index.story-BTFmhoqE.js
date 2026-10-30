import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./build-module-HHKy9azc.js";import{c as o,n as s,t as c}from"./build-module-CqL0UdL5.js";import{a as l,i as u}from"./iframe-BbJPeSVw.js";import{a as d,o as f,t as p}from"./svg-D4K4iM4_.js";import{n as m,t as h}from"./button-01oyTe_f.js";import{n as g,t as _}from"./modal-Dkj06R_g.js";var v,PageControlIcon;function init_icons(){return(init_icons=e((()=>{f(),v=t(),PageControlIcon=()=>(0,v.jsx)(d,{width:`8`,height:`8`,fill:`none`,xmlns:`http://www.w3.org/2000/svg`,children:(0,v.jsx)(p,{cx:`4`,cy:`4`,r:`4`})})})))()}function PageControl({currentPage:e,numberOfPages:t,setCurrentPage:n}){return(0,y.jsx)(`ul`,{className:`components-guide__page-control`,"aria-label":s(`Guide controls`),children:Array.from({length:t}).map((r,i)=>(0,y.jsx)(`li`,{"aria-current":i===e?`step`:void 0,children:(0,y.jsx)(h,{size:`small`,icon:(0,y.jsx)(PageControlIcon,{}),"aria-label":o(s(`Page %1$d of %2$d`),i+1,t),onClick:()=>n(i)},i)},i))})}var y;function init_page_control(){return(init_page_control=e((()=>{c(),m(),init_icons(),y=t();try{PageControl.__docgenInfo={description:``,displayName:`pagecontrol`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/guide/page-control.tsx`,methods:[],props:{currentPage:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/guide/types.ts`,name:`TypeLiteral`}],description:`Current page index.`,name:`currentPage`,required:!0,tags:{},type:{name:`number`}},numberOfPages:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/guide/types.ts`,name:`TypeLiteral`}],description:`Total number of pages.`,name:`numberOfPages`,required:!0,tags:{},type:{name:`number`}},setCurrentPage:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/guide/types.ts`,name:`TypeLiteral`}],description:"Called when user clicks on a `PageControlIcon` button.",name:`setCurrentPage`,required:!0,tags:{},type:{name:`(page: number) => void`}}},tags:{}}}catch{}})))()}function Guide({children:e,className:t,contentLabel:n,finishButtonText:i=s(`Finish`),nextButtonText:o=s(`Next`),previousButtonText:c=s(`Previous`),onFinish:l,pages:d=[]}){let f=(0,r.useRef)(null),[p,m]=(0,r.useState)(0);(0,r.useEffect)(()=>{let e=f.current?.querySelector(`.components-guide`);e instanceof HTMLElement&&e.focus()},[p]),(0,r.useEffect)(()=>{r.Children.count(e)&&a(`Passing children to <Guide>`,{since:`5.5`,alternative:"the `pages` prop"})},[e]),r.Children.count(e)&&(d=r.Children.map(e,e=>({content:e}))??[]);let g=p>0,v=p<d.length-1,goBack=()=>{g&&m(p-1)},goForward=()=>{v&&m(p+1)};return d.length===0?null:(0,b.jsx)(_,{className:u(`components-guide`,t),contentLabel:n,isDismissible:d.length>1,onRequestClose:l,onKeyDown:e=>{e.code===`ArrowLeft`?(goBack(),e.preventDefault()):e.code===`ArrowRight`&&(goForward(),e.preventDefault())},ref:f,children:(0,b.jsxs)(`div`,{className:`components-guide__container`,children:[(0,b.jsxs)(`div`,{className:`components-guide__page`,children:[d[p].image,d.length>1&&(0,b.jsx)(PageControl,{currentPage:p,numberOfPages:d.length,setCurrentPage:m}),d[p].content]}),(0,b.jsxs)(`div`,{className:`components-guide__footer`,children:[g&&(0,b.jsx)(h,{className:`components-guide__back-button`,variant:`tertiary`,onClick:goBack,__next40pxDefaultSize:!0,children:c}),v&&(0,b.jsx)(h,{className:`components-guide__forward-button`,variant:`primary`,onClick:goForward,__next40pxDefaultSize:!0,children:o}),!v&&(0,b.jsx)(h,{className:`components-guide__finish-button`,variant:`primary`,onClick:l,__next40pxDefaultSize:!0,children:i})]})]})})}var b;function init_guide(){return(init_guide=e((()=>{l(),n(),i(),c(),g(),m(),init_page_control(),b=t();try{Guide.__docgenInfo={description:`\`Guide\` is a React component that renders a _user guide_ in a modal. The guide consists of several pages which the user can step through one by one. The guide is finished when the modal is closed or when the user clicks _Finish_ on the last page of the guide.

\`\`\`jsx
function MyTutorial() {
	const [ isOpen, setIsOpen ] = useState( true );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Guide
			onFinish={ () => setIsOpen( false ) }
			pages={ [
				{
					content: <p>Welcome to the ACME Store!</p>,
				},
				{
					image: <img src="https://acmestore.com/add-to-cart.png" />,
					content: (
						<p>
							Click <i>Add to Cart</i> to buy a product.
						</p>
					),
				},
			] }
		/>
	);
}
\`\`\``,displayName:`Guide`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/guide/index.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/guide/types.ts`,name:`TypeLiteral`}],description:"Deprecated. Use `pages` prop instead.\n@deprecated since 5.5",name:`children`,required:!1,tags:{},type:{name:`ReactNode`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/guide/types.ts`,name:`TypeLiteral`}],description:`A custom class to add to the modal.`,name:`className`,required:!1,tags:{},type:{name:`string`}},contentLabel:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/guide/types.ts`,name:`TypeLiteral`}],description:`Used as the modal's accessibility label.`,name:`contentLabel`,required:!0,tags:{},type:{name:`string | undefined`}},finishButtonText:{defaultValue:{value:`__( 'Finish' )`},declarations:[{fileName:`gutenberg/packages/components/src/guide/types.ts`,name:`TypeLiteral`}],description:`Use this to customize the label of the _Finish_ button shown at the end of the guide.`,name:`finishButtonText`,required:!1,tags:{},type:{name:`string`}},nextButtonText:{defaultValue:{value:`__( 'Next' )`},declarations:[{fileName:`gutenberg/packages/components/src/guide/types.ts`,name:`TypeLiteral`}],description:`Use this to customize the label of the _Next_ button shown on each page of the guide.`,name:`nextButtonText`,required:!1,tags:{},type:{name:`string`}},previousButtonText:{defaultValue:{value:`__( 'Previous' )`},declarations:[{fileName:`gutenberg/packages/components/src/guide/types.ts`,name:`TypeLiteral`}],description:`Use this to customize the label of the _Previous_ button shown on each page of the guide except the first.`,name:`previousButtonText`,required:!1,tags:{},type:{name:`string`}},onFinish:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/guide/types.ts`,name:`TypeLiteral`}],description:`A function which is called when the guide is finished.`,name:`onFinish`,required:!0,tags:{},type:{name:`(event?: SyntheticEvent<Element, Event> | KeyboardEvent<HTMLDivElement> | undefined) => void`}},pages:{defaultValue:{value:`[]`},declarations:[{fileName:`gutenberg/packages/components/src/guide/types.ts`,name:`TypeLiteral`}],description:"A list of objects describing each page in the guide. Each object **must** contain a `'content'` property and may optionally contain a `'image'` property.",name:`pages`,required:!1,tags:{},type:{name:`Page[]`}}},tags:{}}}catch{}})))()}var x,S,Template,C;function init_index_story(){return(init_index_story=e((()=>{n(),m(),init_guide(),x=t(),S={id:`components-guide`,title:`Components/@wordpress-components/Guide`,component:Guide,argTypes:{contentLabel:{control:`text`},finishButtonText:{control:`text`},nextButtonText:{control:`text`},previousButtonText:{control:`text`},onFinish:{action:`onFinish`}},parameters:{componentStatus:{status:`recommended`,whereUsed:`editor`}}},Template=({onFinish:e,...t})=>{let[n,i]=(0,r.useState)(!1),openGuide=()=>i(!0),closeGuide=()=>i(!1);return(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)(h,{__next40pxDefaultSize:!0,variant:`secondary`,onClick:openGuide,children:`Open Guide`}),n&&(0,x.jsx)(Guide,{...t,onFinish:(...t)=>{closeGuide(),e?.(...t)}})]})},C=Template.bind({}),C.args={pages:Array.from({length:3}).map((e,t)=>({content:(0,x.jsx)(`p`,{children:`Page ${t+1}`})}))},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`({
  onFinish,
  ...props
}) => {
  const [isOpen, setOpen] = useState(false);
  const openGuide = () => setOpen(true);
  const closeGuide = () => setOpen(false);
  return <>
            <Button __next40pxDefaultSize variant="secondary" onClick={openGuide}>
                Open Guide
            </Button>
            {isOpen && <Guide {...props} onFinish={(...finishArgs) => {
      closeGuide();
      onFinish?.(...finishArgs);
    }} />}
        </>;
}`,...C.parameters?.docs?.source}}}})))()}init_index_story();export{C as Default,S as default};