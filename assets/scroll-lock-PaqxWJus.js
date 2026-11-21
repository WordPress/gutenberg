import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{n as t,t as n}from"./react-Cd8OJmTE.js";function setLocked(e){let t=document.scrollingElement||document.body;e&&(r=t.scrollTop);let n=e?`add`:`remove`;t.classList[n](`lockscroll`),document.documentElement.classList[n](`lockscroll`),e||(t.scrollTop=r)}function ScrollLock(){return(0,n.useEffect)(()=>(i===0&&setLocked(!0),++i,()=>{i===1&&setLocked(!1),--i}),[]),null}var r,i;function init_scroll_lock(){return(init_scroll_lock=e((()=>{t(),r=0,i=0;try{ScrollLock.__docgenInfo={description:`ScrollLock is a content-free React component for declaratively preventing
scroll bleed from modal UI to the page body. This component applies a
\`lockscroll\` class to the \`document.documentElement\` and
\`document.scrollingElement\` elements to stop the body from scrolling. When it
is present, the lock is applied.

\`\`\`jsx
import { ScrollLock, Button } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyScrollLock = () => {
  const [ isScrollLocked, setIsScrollLocked ] = useState( false );

  const toggleLock = () => {
    setIsScrollLocked( ( locked ) => ! locked ) );
  };

  return (
    <div>
      <Button variant="secondary" onClick={ toggleLock }>
        Toggle scroll lock
      </Button>
      { isScrollLocked && <ScrollLock /> }
      <p>
        Scroll locked:
        <strong>{ isScrollLocked ? 'Yes' : 'No' }</strong>
      </p>
    </div>
  );
};
\`\`\``,displayName:`ScrollLock`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/scroll-lock/index.tsx`,methods:[],props:{},tags:{}}}catch{}})))()}export{init_scroll_lock as n,ScrollLock as t};