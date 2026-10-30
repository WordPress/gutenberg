import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./create-interpolate-element-Dn8dC6qL.js";import{n as i,t as a}from"./strings-74OMIQDH.js";var o,TextHighlight;function init_text_highlight(){return(init_text_highlight=e((()=>{n(),i(),o=t(),TextHighlight=e=>{let{text:t=``,highlight:n=``}=e,i=n.trim();if(!i)return(0,o.jsx)(o.Fragment,{children:t});let s=RegExp(`(${a(i)})`,`gi`);return r(t.replace(s,`<mark>$&</mark>`),{mark:(0,o.jsx)(`mark`,{})})},TextHighlight.displayName=`TextHighlight`;try{TextHighlight.__docgenInfo={description:`Highlights occurrences of a given string within another string of text. Wraps
each match with a \`<mark>\` tag which provides browser default styling.

\`\`\`jsx
import { TextHighlight } from '@wordpress/components';

const MyTextHighlight = () => (
  <TextHighlight
    text="Why do we like Gutenberg? Because Gutenberg is the best!"
    highlight="Gutenberg"
  />
);
\`\`\``,displayName:`TextHighlight`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/text-highlight/index.tsx`,methods:[],props:{highlight:{defaultValue:{value:`''`},declarations:[{fileName:`gutenberg/packages/components/src/text-highlight/types.ts`,name:`TypeLiteral`}],description:"The string to search for and highlight within the `text`. Case\ninsensitive. Multiple matches.",name:`highlight`,required:!0,tags:{},type:{name:`string`}},text:{defaultValue:{value:`''`},declarations:[{fileName:`gutenberg/packages/components/src/text-highlight/types.ts`,name:`TypeLiteral`}],description:"The string of text to be tested for occurrences of then given\n`highlight`.",name:`text`,required:!0,tags:{},type:{name:`string`}}},tags:{}}}catch{}})))()}var s,c,Template,l;function init_index_story(){return(init_index_story=e((()=>{init_text_highlight(),s=t(),c={tags:[`manifest`],component:TextHighlight,title:`Components/@wordpress-components/Typography/TextHighlight`,id:`components-texthighlight`,parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`global`}}},Template=e=>(0,s.jsx)(TextHighlight,{...e}),l=Template.bind({}),l.args={text:`We call the new editor Gutenberg. The entire editing experience has been rebuilt for media rich pages and posts.`,highlight:`Gutenberg`},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`args => {
  return <TextHighlight {...args} />;
}`,...l.parameters?.docs?.source}}}})))()}init_index_story();export{l as Default,c as default};