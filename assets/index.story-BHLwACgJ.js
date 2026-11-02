import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./build-module-CqL0UdL5.js";import{n as o,o as s,r as c,t as l}from"./use-context-system-CiYx-c7e.js";import{n as u,t as d}from"./component-144DDHoP.js";import{n as f,t as p}from"./component-BR1V6hUq.js";import{n as m,t as h}from"./button-8ccnOjTA.js";import{n as g,t as _}from"./component-BYEAdrbI.js";import{n as v,t as y}from"./modal-CJZ_Y3ll.js";var b,x;function init_style_module(){return(init_style_module=e((()=>{b=`_wrapper_1h5dp_1`,x={wrapper:b}})))()}var S,UnconnectedConfirmDialog,C;function init_component(){return(init_component=e((()=>{a(),n(),v(),l(),s(),u(),m(),f(),g(),init_style_module(),S=t(),UnconnectedConfirmDialog=(e,t)=>{let{isOpen:n,onConfirm:a,onCancel:s,children:c,confirmButtonText:l,cancelButtonText:u,isBusy:f,title:m,__experimentalHideHeader:g=!0,...v}=o(e,`ConfirmDialog`),b=x.wrapper,C=(0,r.useRef)(null),w=(0,r.useRef)(null),[T,E]=(0,r.useState)(),[D,O]=(0,r.useState)();(0,r.useEffect)(()=>{let e=n!==void 0;E(!e||n),O(!e)},[n]);let k=(0,r.useCallback)(e=>t=>{e?.(t),D&&E(!1)},[D,E]),A=(0,r.useCallback)(e=>{e.target!==C.current&&e.target!==w.current&&e.key===`Enter`&&k(a)(e)},[k,a]),j=u??i(`Cancel`),M=l??i(`OK`);return(0,S.jsx)(S.Fragment,{children:T&&(0,S.jsx)(y,{onRequestClose:k(s),onKeyDown:A,closeButtonLabel:j,isDismissible:!0,ref:t,overlayClassName:b,title:m,__experimentalHideHeader:g,...v,children:(0,S.jsxs)(_,{spacing:8,children:[(0,S.jsx)(p,{children:c}),(0,S.jsxs)(d,{direction:`row`,justify:`flex-end`,children:[(0,S.jsx)(h,{__next40pxDefaultSize:!0,ref:C,variant:`tertiary`,onClick:k(s),accessibleWhenDisabled:!0,disabled:f,children:j}),(0,S.jsx)(h,{__next40pxDefaultSize:!0,ref:w,variant:`primary`,onClick:k(a),accessibleWhenDisabled:!0,disabled:f,isBusy:f,children:M})]})]})})})},C=c(UnconnectedConfirmDialog,`ConfirmDialog`);try{C.__docgenInfo={description:`\`ConfirmDialog\` is built on top of [\`Modal\`](/packages/components/src/modal/README.md)
and displays a confirmation dialog, with _confirm_ and _cancel_ buttons.

The dialog is confirmed by clicking the _confirm_ button or by pressing the \`Enter\` key.
It is cancelled (closed) by clicking the _cancel_ button, by pressing the \`ESC\` key, or by
clicking outside the dialog focus (i.e. the overlay).

\`ConfirmDialog\` has two main modes: controlled and uncontrolled.

### Uncontrolled mode

Allows the component to be used standalone, just by declaring it as part of another React
component's render method:

- It will be automatically open (displayed) upon mounting.
- It will be automatically closed when clicking the _cancel_ button, by pressing the \`ESC\`
  key, or by clicking outside the dialog focus (i.e. the overlay).
- \`onCancel\` is not mandatory but can be passed. Even if passed, the dialog will still be
  able to close itself.

Activating this mode is as simple as omitting the \`isOpen\` prop. The only mandatory prop
in this case is the \`onConfirm\` callback. The message is passed as the \`children\`.

\`\`\`jsx
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';

function Example() {
	return (
		<ConfirmDialog onConfirm={ () => console.debug( 'Confirmed!' ) }>
			Are you sure? <strong>This action cannot be undone!</strong>
		</ConfirmDialog>
	);
}
\`\`\`

### Controlled mode

Let the parent component control when the dialog is open/closed. It's activated when a
boolean value is passed to \`isOpen\`:

- It will not be automatically closed. You need to let it know when to open/close by
  updating the value of the \`isOpen\` prop.
- Both \`onConfirm\` and the \`onCancel\` callbacks are mandatory props in this mode.
- You'll want to update the state that controls \`isOpen\` from the \`onCancel\` and
  \`onConfirm\` callbacks.

\`\`\`jsx
import { useState } from '@wordpress/element';
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';

function Example() {
	const [ isOpen, setIsOpen ] = useState( true );

	const handleConfirm = () => {
		console.debug( 'Confirmed!' );
		setIsOpen( false );
	};

	const handleCancel = () => {
		console.debug( 'Cancelled!' );
		setIsOpen( false );
	};

	return (
		<ConfirmDialog
			isOpen={ isOpen }
			onConfirm={ handleConfirm }
			onCancel={ handleCancel }
		>
			Are you sure? <strong>This action cannot be undone!</strong>
		</ConfirmDialog>
	);
}
\`\`\``,displayName:`ConfirmDialog`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/confirm-dialog/component.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/confirm-dialog/types.ts`,name:`TypeLiteral`}],description:"The actual message for the dialog. It's passed as children and any valid `ReactNode` is accepted.",name:`children`,required:!0,tags:{},type:{name:`ReactNode`}},size:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/confirm-dialog/types.ts`,name:`TypeLiteral`}],description:"Size of the underlying Modal. See `Modal`'s `size` prop.",name:`size`,required:!1,tags:{},type:{name:`enum`,raw:`"fill" | "small" | "large" | "medium"`,value:[{value:`"fill"`},{value:`"small"`},{value:`"large"`},{value:`"medium"`}]}},onConfirm:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/confirm-dialog/types.ts`,name:`TypeLiteral`}],description:"The callback that's called when the user confirms.\nA confirmation can happen when the `OK` button is clicked or when `Enter` is pressed.",name:`onConfirm`,required:!0,tags:{},type:{name:`(event: DialogInputEvent) => void`}},confirmButtonText:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/confirm-dialog/types.ts`,name:`TypeLiteral`}],description:`The optional custom text to display as the confirmation button's label.`,name:`confirmButtonText`,required:!1,tags:{},type:{name:`string`}},cancelButtonText:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/confirm-dialog/types.ts`,name:`TypeLiteral`}],description:`The optional custom text to display as the cancellation button's label.`,name:`cancelButtonText`,required:!1,tags:{},type:{name:`string`}},onCancel:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/confirm-dialog/types.ts`,name:`TypeLiteral`}],description:"The callback that's called when the user cancels. A cancellation can happen\nwhen the `Cancel` button is clicked, when the `ESC` key is pressed, or when\na click outside of the dialog focus is detected (i.e. in the overlay).\n\nIt's not required if `isOpen` is not set (uncontrolled mode), as the component\nwill take care of closing itself, but you can still pass a callback if something\nmust be done upon cancelling (the component will still close itself in this case).\n\nIf `isOpen` is set (controlled mode), then it's required, and you need to set\nthe state that defines `isOpen` to `false` as part of this callback if you want the\ndialog to close when the user cancels.",name:`onCancel`,required:!1,tags:{},type:{name:`((event: DialogInputEvent) => void)`}},isOpen:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/confirm-dialog/types.ts`,name:`TypeLiteral`}],description:`Defines if the dialog is open (displayed) or closed (not rendered/displayed).
It also implicitly toggles the controlled mode if set or the uncontrolled mode if it's not set.`,name:`isOpen`,required:!1,tags:{},type:{name:`boolean`}},isBusy:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/confirm-dialog/types.ts`,name:`TypeLiteral`}],description:`Indicates activity while an action is being performed.
When \`true\`, the confirm button will show a busy state.
Both buttons will be disabled.`,name:`isBusy`,required:!1,tags:{},type:{name:`boolean`}},title:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/confirm-dialog/types.ts`,name:`TypeLiteral`}],description:"The title of the underlying `Modal`: its accessible name, and the\nvisible heading unless `__experimentalHideHeader` is `true`.",name:`title`,required:!1,tags:{},type:{name:`string`}},__experimentalHideHeader:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/components/src/confirm-dialog/types.ts`,name:`TypeLiteral`}],description:"Whether the underlying `Modal` should hide its header, `title` included.",name:`__experimentalHideHeader`,required:!1,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}})))()}var w,T,E,Template,D,O,k;function init_index_story(){return(init_index_story=e((()=>{n(),m(),init_component(),w=t(),{fn:T}=__STORYBOOK_MODULE_TEST__,E={component:C,title:`Components/@wordpress-components/Overlays/ConfirmDialog`,id:`components-confirmdialog`,argTypes:{isOpen:{control:!1}},tags:[`status-experimental`,`manifest`],args:{onCancel:T(),onConfirm:T()},parameters:{controls:{expanded:!0},componentStatus:{status:`recommended`,whereUsed:`global`,notes:"Will be superseded by [`AlertDialog`](?path=/docs/design-system-components-alertdialog--docs) in `@wordpress/ui`, but continue using for now."},docs:{canvas:{sourceState:`shown`}}}},Template=({onConfirm:e,onCancel:t,...n})=>{let[i,a]=(0,r.useState)(!1),handleConfirm=t=>{e(t),a(!1)},handleCancel=e=>{t?.(e),a(!1)};return(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(h,{__next40pxDefaultSize:!0,variant:`primary`,onClick:()=>a(!0),children:`Open ConfirmDialog`}),(0,w.jsx)(C,{...n,isOpen:i,onConfirm:handleConfirm,onCancel:handleCancel,children:n.children})]})},D=Template.bind({}),O=`() => {
  const [ isOpen, setIsOpen ] = useState( false );
  const [ confirmVal, setConfirmVal ] = useState('');

  const handleConfirm = () => {
    setConfirmVal( 'Confirmed!' );
    setIsOpen( false );
  };

  const handleCancel = () => {
    setConfirmVal( 'Cancelled' );
    setIsOpen( false );
  };

  return (
    <>
      <ConfirmDialog
        isOpen={ isOpen }
        onConfirm={ handleConfirm }
        onCancel={ handleCancel }
      >
        Would you like to privately publish the post now?
      </ConfirmDialog>

      <Heading level={ 1 }>{ confirmVal }</Heading>

      <Button variant="primary" onClick={ () => setIsOpen( true ) }>
        Open ConfirmDialog
      </Button>
    </>
  );
};`,D.args={children:`Would you like to privately publish the post now?`},D.parameters={docs:{source:{code:O,language:`jsx`,type:`auto`}}},k=Template.bind({}),k.args={...D.args,cancelButtonText:`No thanks`,confirmButtonText:`Yes please!`},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`({
  onConfirm,
  onCancel,
  ...args
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleConfirm: typeof onConfirm = confirmArgs => {
    onConfirm(confirmArgs);
    setIsOpen(false);
  };
  const handleCancel: typeof onCancel = cancelArgs => {
    onCancel?.(cancelArgs);
    setIsOpen(false);
  };
  return <>
            <Button __next40pxDefaultSize variant="primary" onClick={() => setIsOpen(true)}>
                Open ConfirmDialog
            </Button>

            <ConfirmDialog {...args} isOpen={isOpen} onConfirm={handleConfirm} onCancel={handleCancel}>
                {args.children}
            </ConfirmDialog>
        </>;
}`,...D.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`({
  onConfirm,
  onCancel,
  ...args
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleConfirm: typeof onConfirm = confirmArgs => {
    onConfirm(confirmArgs);
    setIsOpen(false);
  };
  const handleCancel: typeof onCancel = cancelArgs => {
    onCancel?.(cancelArgs);
    setIsOpen(false);
  };
  return <>
            <Button __next40pxDefaultSize variant="primary" onClick={() => setIsOpen(true)}>
                Open ConfirmDialog
            </Button>

            <ConfirmDialog {...args} isOpen={isOpen} onConfirm={handleConfirm} onCancel={handleCancel}>
                {args.children}
            </ConfirmDialog>
        </>;
}`,...k.parameters?.docs?.source}}}})))()}init_index_story();export{D as Default,k as WithCustomButtonLabels,E as default};