import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{i,n as a,t as o}from"./build-module-CqL0UdL5.js";import{n as s,t as c}from"./range-control-DIA0pM6q.js";import{n as l,t as u}from"./component-lc2omK31.js";import{n as d,t as f}from"./select-control-Bg7jd7xP.js";import{n as p,t as m}from"./form-token-field-CY0odShF.js";import{n as h,t as g}from"./tree-select-BOgQV6_7.js";function buildTermsTree(e){let t=e.map(e=>({children:[],parent:null,...e,id:String(e.id)}));if(!ensureParentsAreDefined(t))return t;let n=t.reduce((e,t)=>{let{parent:n}=t;return e[n]||(e[n]=[]),e[n].push(t),e},{}),fillWithChildren=e=>e.map(e=>{let t=n[e.id];return{...e,children:t&&t.length?fillWithChildren(t):[]}});return fillWithChildren(n[0]||[])}var ensureParentsAreDefined;function init_terms(){return(init_terms=e((()=>{ensureParentsAreDefined=e=>e.every(e=>e.parent!==null)})))()}function AuthorSelect({label:e,noOptionLabel:t,authorList:n,selectedAuthorId:r,onChange:i}){if(!n)return null;let a=buildTermsTree(n);return(0,_.jsx)(g,{label:e,noOptionLabel:t,onChange:i,tree:a,selectedId:r===void 0?void 0:String(r)})}var _;function init_author_select(){return(init_author_select=e((()=>{init_terms(),h(),_=t();try{AuthorSelect.__docgenInfo={description:``,displayName:`authorselect`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/query-controls/author-select.tsx`,methods:[],props:{label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`}],description:`If this property is added, a label will be generated using label property as the content.`,name:`label`,parent:{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`},required:!1,tags:{},type:{name:`ReactNode`}},noOptionLabel:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tree-select/types.ts`,name:`TreeSelectProps`}],description:`If this property is added, an option will be added with this label to represent empty selection.`,name:`noOptionLabel`,parent:{fileName:`gutenberg/packages/components/src/tree-select/types.ts`,name:`TreeSelectProps`},required:!1,tags:{},type:{name:`string`}},authorList:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:``,name:`authorList`,required:!1,tags:{},type:{name:`Author[]`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:``,name:`onChange`,required:!0,tags:{},type:{name:`(newAuthor: string) => void`}},selectedAuthorId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:``,name:`selectedAuthorId`,required:!1,tags:{},type:{name:`number`}}},tags:{}}}catch{}})))()}function CategorySelect({label:e,noOptionLabel:t,categoriesList:n,selectedCategoryId:i,onChange:a,...o}){let s=(0,r.useMemo)(()=>buildTermsTree(n),[n]);return(0,v.jsx)(g,{label:e,noOptionLabel:t,onChange:a,tree:s,selectedId:i===void 0?void 0:String(i),...o})}var v;function init_category_select(){return(init_category_select=e((()=>{n(),init_terms(),h(),v=t();try{CategorySelect.__docgenInfo={description:``,displayName:`categoryselect`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/query-controls/category-select.tsx`,methods:[],props:{label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`}],description:`If this property is added, a label will be generated using label property as the content.`,name:`label`,parent:{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`},required:!1,tags:{},type:{name:`ReactNode`}},noOptionLabel:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tree-select/types.ts`,name:`TreeSelectProps`}],description:`If this property is added, an option will be added with this label to represent empty selection.`,name:`noOptionLabel`,parent:{fileName:`gutenberg/packages/components/src/tree-select/types.ts`,name:`TreeSelectProps`},required:!1,tags:{},type:{name:`string`}},categoriesList:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:``,name:`categoriesList`,required:!0,tags:{},type:{name:`Category[]`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:``,name:`onChange`,required:!0,tags:{},type:{name:`(newCategory: string) => void`}},selectedCategoryId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:``,name:`selectedCategoryId`,required:!1,tags:{},type:{name:`number`}}},tags:{}}}catch{}})))()}function isSingleCategorySelection(e){return`categoriesList`in e}function isMultipleCategorySelection(e){return`categorySuggestions`in e}function QueryControls({authorList:e,selectedAuthorId:t,numberOfItems:n,order:r,orderBy:o,orderByOptions:s=C,maxItems:l=x,minItems:d=b,onAuthorChange:p,onNumberOfItemsChange:h,onOrderChange:g,onOrderByChange:_,...v}){return(0,y.jsx)(u,{spacing:`4`,className:`components-query-controls`,children:[g&&_&&(0,y.jsx)(f,{label:a(`Order by`),value:o===void 0||r===void 0?void 0:`${o}/${r}`,options:s,onChange:e=>{if(typeof e!=`string`)return;let[t,n]=e.split(`/`);n!==r&&g(n),t!==o&&_(t)}},`query-controls-order-select`),isSingleCategorySelection(v)&&v.categoriesList&&v.onCategoryChange&&(0,y.jsx)(CategorySelect,{categoriesList:v.categoriesList,label:a(`Category`),noOptionLabel:i(`All`,`categories`),selectedCategoryId:v.selectedCategoryId,onChange:v.onCategoryChange},`query-controls-category-select`),isMultipleCategorySelection(v)&&v.categorySuggestions&&v.onCategoryChange&&(0,y.jsx)(m,{label:a(`Categories`),value:v.selectedCategories&&v.selectedCategories.map(e=>({id:e.id,value:e.name||e.value})),suggestions:Object.keys(v.categorySuggestions),onChange:v.onCategoryChange,maxSuggestions:S},`query-controls-categories-select`),p&&(0,y.jsx)(AuthorSelect,{authorList:e,label:a(`Author`),noOptionLabel:i(`All`,`authors`),selectedAuthorId:t,onChange:p},`query-controls-author-select`),h&&(0,y.jsx)(c,{label:a(`Number of items`),value:n,onChange:h,min:d,max:l,required:!0},`query-controls-range-control`)]})}var y,b,x,S,C;function init_query_controls(){return(init_query_controls=e((()=>{o(),init_author_select(),init_category_select(),p(),s(),d(),l(),y=t(),b=1,x=100,S=20,C=[{label:a(`Newest to oldest`),value:`date/desc`},{label:a(`Oldest to newest`),value:`date/asc`},{label:a(`A → Z`),value:`title/asc`},{label:a(`Z → A`),value:`title/desc`}];try{QueryControls.__docgenInfo={description:`Controls to query for posts.

\`\`\`jsx
const MyQueryControls = () => (
  <QueryControls
    { ...{ maxItems, minItems, numberOfItems, order, orderBy, orderByOptions } }
    onOrderByChange={ ( newOrderBy ) => {
      updateQuery( { orderBy: newOrderBy } )
    }
    onOrderChange={ ( newOrder ) => {
      updateQuery( { order: newOrder } )
    }
    categoriesList={ categories }
    selectedCategoryId={ category }
    onCategoryChange={ ( newCategory ) => {
      updateQuery( { category: newCategory } )
    }
    onNumberOfItemsChange={ ( newNumberOfItems ) => {
      updateQuery( { numberOfItems: newNumberOfItems } )
    } }
  />
);
\`\`\``,displayName:`QueryControls`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/query-controls/index.tsx`,methods:[],props:{authorList:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:`An array of the authors to select from.`,name:`authorList`,required:!1,tags:{},type:{name:`Author[]`}},maxItems:{defaultValue:{value:`100`},declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:`The maximum number of items.`,name:`maxItems`,required:!1,tags:{},type:{name:`number`}},minItems:{defaultValue:{value:`1`},declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:`The minimum number of items.`,name:`minItems`,required:!1,tags:{},type:{name:`number`}},numberOfItems:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:`The selected number of items to retrieve via the query.`,name:`numberOfItems`,required:!1,tags:{},type:{name:`number`}},onAuthorChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:`A function that receives the new author value.
If not specified, the author controls are not rendered.`,name:`onAuthorChange`,required:!1,tags:{},type:{name:`((newAuthor: string) => void)`}},onNumberOfItemsChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:`A function that receives the new number of items.
If not specified, then the number of items
range control is not rendered.`,name:`onNumberOfItemsChange`,required:!1,tags:{},type:{name:`((newNumber?: number) => void)`}},onOrderChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:`A function that receives the new order value.
If this prop or the \`onOrderByChange\` prop are not specified,
then the order controls are not rendered.`,name:`onOrderChange`,required:!1,tags:{},type:{name:`((newOrder: Order) => void)`}},onOrderByChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:`A function that receives the new orderby value.
If this prop or the \`onOrderChange\` prop are not specified,
then the order controls are not rendered.`,name:`onOrderByChange`,required:!1,tags:{},type:{name:`((newOrderBy: OrderBy) => void)`}},order:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:`The order in which to retrieve posts.`,name:`order`,required:!1,tags:{},type:{name:`enum`,raw:`Order`,value:[{value:`"desc"`},{value:`"asc"`}]}},orderBy:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:`The meta key by which to order posts.`,name:`orderBy`,required:!1,tags:{},type:{name:`enum`,raw:`OrderBy`,value:[{value:`"date"`},{value:`"title"`},{value:`"menu_order"`}]}},orderByOptions:{defaultValue:{value:`[
	{
		label: __( 'Newest to oldest' ),
		value: 'date/desc',
	},
	{
		label: __( 'Oldest to newest' ),
		value: 'date/asc',
	},
	{
		/* translators: Label for ordering posts by title in ascending order. */
		label: __( 'A → Z' ),
		value: 'title/asc',
	},
	{
		/* translators: Label for ordering posts by title in descending order. */
		label: __( 'Z → A' ),
		value: 'title/desc',
	},
]`},declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:`List of available ordering options.`,name:`orderByOptions`,required:!1,tags:{},type:{name:`OrderByOption[]`}},selectedAuthorId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:`The selected author ID.`,name:`selectedAuthorId`,required:!1,tags:{},type:{name:`number`}},__next40pxDefaultSize:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:`Start opting into the larger default height that will become the
default size in a future version.
@deprecated Default behavior since WP 6.7. Prop can be safely removed.
@ignore`,name:`__next40pxDefaultSize`,required:!1,tags:{},type:{name:`boolean`}},categoriesList:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:`An array of categories. When passed in conjunction with the
\`onCategoryChange\` prop, it causes the component to render UI that allows
selecting one category at a time.`,name:`categoriesList`,required:!1,tags:{},type:{name:`Category[]`}},selectedCategoryId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:"The selected category for the `categoriesList` prop.",name:`selectedCategoryId`,required:!1,tags:{},type:{name:`number`}},onCategoryChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`},{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:`A function that receives the new category value. If not specified, the
category controls are not rendered.
The function's signature changes depending on whether multiple category
selection is enabled or not.`,name:`onCategoryChange`,required:!1,tags:{},type:{name:`((tokens: (string | TokenItem)[]) => void) | ((newCategory: string) => void)`}},categorySuggestions:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:`An object of categories with the category name as the key. When passed in
conjunction with the \`onCategoryChange\` prop, it causes the component to
render UI that enables multiple selection.`,name:`categorySuggestions`,required:!1,tags:{},type:{name:`Record<string, Category>`}},selectedCategories:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/query-controls/types.ts`,name:`TypeLiteral`}],description:"The selected categories for the `categorySuggestions` prop.",name:`selectedCategories`,required:!1,tags:{},type:{name:`Category[]`}}},tags:{}}}catch{}})))()}var w,T,E,Default,SingleCategoryTemplate,D;function init_index_story(){return(init_index_story=e((()=>{n(),init_query_controls(),w=t(),{fn:T}=__STORYBOOK_MODULE_TEST__,E={id:`components-querycontrols`,title:`Components/@wordpress-components/QueryControls`,component:QueryControls,argTypes:{numberOfItems:{control:!1},order:{control:!1},orderBy:{control:!1},selectedAuthorId:{control:!1},selectedCategories:{control:!1},selectedCategoryId:{control:!1}},args:{onAuthorChange:T(),onNumberOfItemsChange:T(),onOrderByChange:T(),onOrderChange:T(),onCategoryChange:T()},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`editor`}}},Default=e=>{let{onAuthorChange:t,onCategoryChange:n,onNumberOfItemsChange:i,onOrderByChange:a,onOrderChange:o,...s}=e,[c,l]=(0,r.useState)(s.numberOfItems),[u,d]=(0,r.useState)(s.order),[f,p]=(0,r.useState)(s.orderBy),[m,h]=(0,r.useState)(s.selectedAuthorId),[g,_]=(0,r.useState)(s.selectedCategories),handleCategoryChange=e=>{if(n?.(e),e.some(e=>typeof e==`string`&&!s.categorySuggestions?.[e]))return;let t=e.map(e=>typeof e==`string`?s.categorySuggestions?.[e]:e).filter(Boolean);_(t)};return(0,w.jsx)(QueryControls,{...s,numberOfItems:c,onCategoryChange:handleCategoryChange,onOrderByChange:e=>{a?.(e),p(e)},onOrderChange:e=>{o?.(e),d(e)},order:u,orderBy:f,onNumberOfItemsChange:e=>{i?.(e),l(e)},onAuthorChange:e=>{t?.(e),h(Number(e))},selectedAuthorId:m,selectedCategories:g})},Default.args={authorList:[{id:1,name:`admin`},{id:2,name:`editor`}],categorySuggestions:{TypeScript:{id:11,name:`TypeScript`,parent:0},JavaScript:{id:12,name:`JavaScript`,parent:0}},selectedCategories:[{id:11,name:`JavaScript`,parent:0}],numberOfItems:5,order:`desc`,orderBy:`date`,selectedAuthorId:1},SingleCategoryTemplate=e=>{let{onAuthorChange:t,onCategoryChange:n,onNumberOfItemsChange:i,onOrderByChange:a,onOrderChange:o,...s}=e,[c,l]=(0,r.useState)(s.order),[u,d]=(0,r.useState)(s.orderBy),[f,p]=(0,r.useState)(s.selectedCategoryId),handleCategoryChange=e=>{n?.(e),p(Number(e))};return(0,w.jsx)(QueryControls,{...s,onCategoryChange:handleCategoryChange,onOrderByChange:e=>{d(e)},onOrderChange:e=>{o?.(e),l(e)},order:c,orderBy:u,selectedCategoryId:f})},D=SingleCategoryTemplate.bind({}),D.args={categoriesList:[{id:11,name:`TypeScript`,parent:0},{id:12,name:`JavaScript`,parent:0}],selectedCategoryId:11},Default.parameters={...Default.parameters,docs:{...Default.parameters?.docs,source:{originalSource:`args => {
  const {
    onAuthorChange,
    onCategoryChange,
    onNumberOfItemsChange,
    onOrderByChange,
    onOrderChange,
    ...props
  } = args as QueryControlsWithMultipleCategorySelectionProps;
  const [ownNumberOfItems, setOwnNumberOfItems] = useState(props.numberOfItems);
  const [ownOrder, setOwnOrder] = useState(props.order);
  const [ownOrderBy, setOwnOrderBy] = useState(props.orderBy);
  const [ownSelectedAuthorId, setOwnSelectedAuthorId] = useState(props.selectedAuthorId);
  const [ownSelectedCategories, setOwnSelectedCategories] = useState(props.selectedCategories);
  const handleCategoryChange: QueryControlsWithMultipleCategorySelectionProps['onCategoryChange'] = tokens => {
    onCategoryChange?.(tokens);
    const hasNoSuggestion = tokens.some(token => typeof token === 'string' && !props.categorySuggestions?.[token]);
    if (hasNoSuggestion) {
      return;
    }
    const allCategories = tokens.map(token => {
      return typeof token === 'string' ? props.categorySuggestions?.[token] : token;
    }).filter(Boolean) as Array<Required<Category>>;
    setOwnSelectedCategories(allCategories);
  };
  return <QueryControls {...props} numberOfItems={ownNumberOfItems} onCategoryChange={handleCategoryChange} onOrderByChange={newOrderBy => {
    onOrderByChange?.(newOrderBy);
    setOwnOrderBy(newOrderBy);
  }} onOrderChange={newOrder => {
    onOrderChange?.(newOrder);
    setOwnOrder(newOrder);
  }} order={ownOrder} orderBy={ownOrderBy} onNumberOfItemsChange={newNumber => {
    onNumberOfItemsChange?.(newNumber);
    setOwnNumberOfItems(newNumber);
  }} onAuthorChange={newAuthor => {
    onAuthorChange?.(newAuthor);
    setOwnSelectedAuthorId(Number(newAuthor));
  }} selectedAuthorId={ownSelectedAuthorId} selectedCategories={ownSelectedCategories} />;
}`,...Default.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`args => {
  const {
    onAuthorChange,
    onCategoryChange,
    onNumberOfItemsChange,
    onOrderByChange,
    onOrderChange,
    ...props
  } = args as QueryControlsWithSingleCategorySelectionProps;
  const [ownOrder, setOwnOrder] = useState(props.order);
  const [ownOrderBy, setOwnOrderBy] = useState(props.orderBy);
  const [ownSelectedCategoryId, setSelectedCategoryId] = useState(props.selectedCategoryId);
  const handleCategoryChange: QueryControlsWithSingleCategorySelectionProps['onCategoryChange'] = newCategory => {
    onCategoryChange?.(newCategory);
    setSelectedCategoryId(Number(newCategory));
  };
  return <QueryControls {...props} onCategoryChange={handleCategoryChange} onOrderByChange={newOrderBy => {
    setOwnOrderBy(newOrderBy);
  }} onOrderChange={newOrder => {
    onOrderChange?.(newOrder);
    setOwnOrder(newOrder);
  }} order={ownOrder} orderBy={ownOrderBy} selectedCategoryId={ownSelectedCategoryId} />;
}`,...D.parameters?.docs?.source}}}})))()}init_index_story();export{Default,D as SelectSingleCategory,E as default};