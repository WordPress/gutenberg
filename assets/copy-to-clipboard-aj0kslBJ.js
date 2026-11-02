import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,l as n,r,u as i}from"./blocks-Bi8bw4xb.js";import{t as a}from"./jsx-runtime-BxZPLZy3.js";import{i as o,r as s}from"./react-sPqhvIIV.js";import{r as c,t as l}from"./copy-from-menu.story-gba5Bc-0.js";import{r as u,t as d}from"./copy-to-clipboard.story-DZaKUNFw.js";var f;function init_copy_to_clipboard(){return(init_copy_to_clipboard=e((()=>{f=`import { speak } from '@wordpress/a11y';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { check, copy, error } from '@wordpress/icons';
import { Button, IconButton, Stack, Text } from '@wordpress/ui';

const SAMPLE_VALUE = 'Sample text';
const FEEDBACK_TIMEOUT = 2000;

type CopyResult = 'idle' | 'copied' | 'error';

const RESULT_ICON = {
	idle: copy,
	copied: check,
	error,
};

function useCopyFeedback() {
	const [ feedback, setFeedback ] = useState< { result: CopyResult } >( {
		result: 'idle',
	} );

	useEffect( () => {
		if ( feedback.result === 'idle' ) {
			return;
		}
		const timeoutId = setTimeout(
			() => setFeedback( { result: 'idle' } ),
			FEEDBACK_TIMEOUT
		);
		return () => clearTimeout( timeoutId );
	}, [ feedback ] );

	const ref = useCopyToClipboard(
		SAMPLE_VALUE,
		() => {
			// A new feedback object restarts the timeout for repeated copies.
			setFeedback( { result: 'copied' } );
			speak( 'Copied to clipboard' );
		},
		() => {
			setFeedback( { result: 'error' } );
			speak( "Couldn't copy to clipboard." );
		}
	);

	return { result: feedback.result, ref };
}

/**
 * Composes \`Button\` into a copy action with inline feedback.
 *
 * The visible label and accessible name stay "Copy". A check icon shows
 * success and an error icon shows failure. \`speak()\` announces the outcome.
 */
export function CopyToClipboardExample() {
	const { result, ref } = useCopyFeedback();

	return (
		<Stack direction="row" gap="sm" align="center">
			<Text>{ SAMPLE_VALUE }</Text>
			<Button ref={ ref } variant="minimal" tone="neutral" size="compact">
				<Button.Icon icon={ RESULT_ICON[ result ] } />
				Copy
			</Button>
		</Stack>
	);
}

/**
 * Composes \`IconButton\` into the same copy action.
 *
 * \`label\` stays "Copy", so the accessible name and tooltip do not change.
 * A check icon shows success and an error icon shows failure. \`speak()\`
 * announces the outcome.
 */
export function CopyToClipboardIconButtonExample() {
	const { result, ref } = useCopyFeedback();

	return (
		<Stack direction="row" gap="sm" align="center">
			<Text>{ SAMPLE_VALUE }</Text>
			<IconButton
				ref={ ref }
				label="Copy"
				icon={ RESULT_ICON[ result ] }
				variant="minimal"
				tone="neutral"
				size="compact"
			/>
		</Stack>
	);
}

/**
 * Labeled and icon-only copy actions, shown together in the pattern.
 */
export function CopyToClipboardExamples() {
	return (
		<Stack direction="column" gap="lg">
			<CopyToClipboardExample />
			<CopyToClipboardIconButtonExample />
		</Stack>
	);
}
`;try{CopyToClipboardExample.__docgenInfo={description:'Composes `Button` into a copy action with inline feedback.\n\nThe visible label and accessible name stay "Copy". A check icon shows\nsuccess and an error icon shows failure. `speak()` announces the outcome.',displayName:`CopyToClipboardExample`,filePath:`/home/runner/work/gutenberg/gutenberg/storybook/stories/design-system/patterns/copy-to-clipboard.tsx`,methods:[],props:{},tags:{}}}catch{}try{CopyToClipboardIconButtonExample.__docgenInfo={description:'Composes `IconButton` into the same copy action.\n\n`label` stays "Copy", so the accessible name and tooltip do not change.\nA check icon shows success and an error icon shows failure. `speak()`\nannounces the outcome.',displayName:`CopyToClipboardIconButtonExample`,filePath:`/home/runner/work/gutenberg/gutenberg/storybook/stories/design-system/patterns/copy-to-clipboard.tsx`,methods:[],props:{},tags:{}}}catch{}try{CopyToClipboardExamples.__docgenInfo={description:`Labeled and icon-only copy actions, shown together in the pattern.`,displayName:`CopyToClipboardExamples`,filePath:`/home/runner/work/gutenberg/gutenberg/storybook/stories/design-system/patterns/copy-to-clipboard.tsx`,methods:[],props:{},tags:{}}}catch{}})))()}var p;function init_copy_from_menu(){return(init_copy_from_menu=e((()=>{p=`import { useCopyToClipboard } from '@wordpress/compose';
import { useRef, useState } from '@wordpress/element';
import { copy } from '@wordpress/icons';
import { SnackbarList } from '@wordpress/components';
import { Menu, Stack } from '@wordpress/ui';
import styles from './copy-from-menu.module.css';

const SAMPLE_LINK = 'https://example.com/sample-page';
const LINK_COPIED_MESSAGE = 'Link copied to clipboard';
const LINK_COPY_FAILED_MESSAGE = "Couldn't copy link to clipboard.";

/**
 * Copies a link from a menu item.
 *
 * The menu closes on activation, so the confirmation is a \`SnackbarList\`
 * rather than a change to the item. The list animates the snackbar, and
 * \`Snackbar\` announces the message politely. The example does not add a
 * second live region.
 */
export function CopyFromMenuExample() {
	const [ notices, setNotices ] = useState<
		Array< { id: string; content: string } >
	>( [] );
	const noticeIdRef = useRef( 0 );

	function showSnackbar( message: string ) {
		noticeIdRef.current += 1;
		setNotices( [
			{
				id: String( noticeIdRef.current ),
				content: message,
			},
		] );
	}

	function onRemove( id: string ) {
		setNotices( ( current ) =>
			current.filter( ( notice ) => notice.id !== id )
		);
	}

	const ref = useCopyToClipboard(
		SAMPLE_LINK,
		() => showSnackbar( LINK_COPIED_MESSAGE ),
		() => showSnackbar( LINK_COPY_FAILED_MESSAGE )
	);

	return (
		<Stack
			align="center"
			justify="center"
			style={ {
				position: 'relative',
				minHeight: '20rem',
			} }
		>
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item
						ref={ ref }
						prefix={ <Menu.PrefixIcon icon={ copy } /> }
					>
						<Menu.ItemLabel>Copy link</Menu.ItemLabel>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
			<SnackbarList
				className={ styles.snackbars }
				notices={ notices }
				onRemove={ onRemove }
			/>
		</Stack>
	);
}
`;try{CopyFromMenuExample.__docgenInfo={description:`Copies a link from a menu item.

The menu closes on activation, so the confirmation is a \`SnackbarList\`
rather than a change to the item. The list animates the snackbar, and
\`Snackbar\` announces the message politely. The example does not add a
second live region.`,displayName:`CopyFromMenuExample`,filePath:`/home/runner/work/gutenberg/gutenberg/storybook/stories/design-system/patterns/copy-from-menu.tsx`,methods:[],props:{},tags:{}}}catch{}})))()}function _createMdxContent(e){let t={a:`a`,code:`code`,h1:`h1`,h2:`h2`,li:`li`,p:`p`,strong:`strong`,ul:`ul`,...o(),...e.components};return(0,m.jsxs)(m.Fragment,{children:[(0,m.jsx)(i,{title:`Design System/Patterns/Copy to Clipboard`,tags:[`manifest`]}),`
`,(0,m.jsx)(t.h1,{id:`copy-to-clipboard`,children:`Copy to Clipboard`}),`
`,(0,m.jsx)(t.p,{children:`Choose feedback that remains visible after the action runs. A control that stays on the page can confirm the copy itself. When a menu closes, a snackbar can keep the confirmation visible.`}),`
`,(0,m.jsx)(t.h2,{id:`standalone-button`,children:`Standalone button`}),`
`,(0,m.jsxs)(t.p,{children:[`Put the confirmation on the button so it stays with the control that produced the result. Use `,(0,m.jsx)(t.code,{children:`variant="minimal"`}),`, `,(0,m.jsx)(t.code,{children:`tone="neutral"`}),`, and `,(0,m.jsx)(t.code,{children:`size="compact"`}),`: a copy action is rarely the primary button on the page. Don't use a snackbar here: the button is still visible. Don't use a tooltip: touch users and many keyboard users never see it.`]}),`
`,(0,m.jsx)(r,{of:d,source:{code:f,language:`tsx`,type:`code`}}),`
`,(0,m.jsxs)(t.p,{children:[`The visible label and the accessible name stay "Copy". A check icon shows success, and an error icon shows failure, so the control is not renamed while it has focus. Copy with `,(0,m.jsx)(t.code,{children:`useCopyToClipboard`}),` from `,(0,m.jsx)(t.code,{children:`@wordpress/compose`}),`, and use its `,(0,m.jsx)(t.code,{children:`onError`}),` callback when the write fails. Call `,(0,m.jsx)(t.code,{children:`speak()`}),` with "Copied to clipboard", or "Couldn't copy to clipboard." if copying fails, to announce the outcome politely. Focus stays on the button.`]}),`
`,(0,m.jsxs)(t.p,{children:[`For an icon-only control, use `,(0,m.jsx)(t.code,{children:`IconButton`}),` with the same variant, tone, and size, and keep `,(0,m.jsx)(t.code,{children:`label="Copy"`}),`. That label is the accessible name and the tooltip. Swap the icon for a check on success or an error icon on failure, and announce the result with `,(0,m.jsx)(t.code,{children:`speak()`}),`. The success and error messages belong in that announcement rather than only in the tooltip.`]}),`
`,(0,m.jsxs)(t.p,{children:[`Copying is a one-time action. `,(0,m.jsx)(t.code,{children:`aria-pressed`}),` describes a toggle that stays on or off, so this button does not use it.`]}),`
`,(0,m.jsx)(t.p,{children:`Restart the feedback timeout after each copy result, including repeated successes or failures, so the icon remains visible for the full duration after the latest attempt completes.`}),`
`,(0,m.jsx)(t.h2,{id:`copying-from-a-menu`,children:`Copying from a menu`}),`
`,(0,m.jsx)(t.p,{children:`When a copy action appears inside a menu, the menu typically closes immediately after the action is activated. A snackbar can provide visual confirmation after the menu item disappears. Use the screen's existing snackbar region where available.`}),`
`,(0,m.jsxs)(t.p,{children:[`Consider the placement and timing concerns tracked in `,(0,m.jsx)(t.a,{href:`https://github.com/WordPress/gutenberg/issues/16549`,rel:`nofollow`,children:`Snackbar Accessibility Issues (#16549)`}),`. A message far from the trigger can fall outside a person's magnified view, and an automatically dismissed message can disappear before they read or reach it. A polite announcement doesn't remove these concerns.`]}),`
`,(0,m.jsx)(r,{of:l,source:{code:p,language:`tsx`,type:`code`}}),`
`,(0,m.jsxs)(t.p,{children:[`This example uses `,(0,m.jsx)(t.code,{children:`useCopyToClipboard`}),` for the write and `,(0,m.jsx)(t.code,{children:`SnackbarList`}),` for the message. The list animates the snackbar in and out, and `,(0,m.jsx)(t.code,{children:`Snackbar`}),` announces "Link copied to clipboard", or "Couldn't copy link to clipboard." if copying fails, through its own polite live region. That region stays on the page after the menu closes, so the example does not add a second one. The item label stays "Copy link".`]}),`
`,(0,m.jsxs)(t.p,{children:[`The local `,(0,m.jsx)(t.code,{children:`SnackbarList`}),` and its positioning styles keep this preview self-contained. In a WordPress screen, use `,(0,m.jsx)(t.code,{children:`core/notices`}),` to create notices with `,(0,m.jsx)(t.code,{children:`type: 'snackbar'`}),` for the screen's existing snackbar region instead of adding a second list.`]}),`
`,(0,m.jsx)(t.h2,{id:`guidance`,children:`Guidance`}),`
`,(0,m.jsx)(n,{children:`
| Context | Recommended feedback | Rationale |
| --- | --- | --- |
| Standalone copy button | Temporary check or error icon; the label stays "Copy" | The control remains visible. The name stays the action, and the icon shows success or failure. |
| Copy action in a menu | The screen's existing snackbar region | The confirmation remains visible after the menu closes; assess its placement and timing. |
`}),`
`,(0,m.jsxs)(t.ul,{children:[`
`,(0,m.jsxs)(t.li,{children:[(0,m.jsx)(t.strong,{children:`Keep standalone feedback on the button.`}),` A snackbar isn't needed when the button can show the result.`]}),`
`,(0,m.jsxs)(t.li,{children:[(0,m.jsx)(t.strong,{children:`Keep menu feedback visible after closing.`}),` Use the screen's existing snackbar region and assess its placement and timing.`]}),`
`,(0,m.jsxs)(t.li,{children:[(0,m.jsx)(t.strong,{children:`Always announce the outcome accessibly.`}),` Visual feedback alone isn't sufficient.`]}),`
`,(0,m.jsxs)(t.li,{children:[(0,m.jsx)(t.strong,{children:`Avoid redundant feedback.`}),` Don't show both inline confirmation and a snackbar for the same action unless there's a compelling reason.`]}),`
`]})]})}function MDXContent(e={}){let{wrapper:t}={...o(),...e.components};return t?(0,m.jsx)(t,{...e,children:(0,m.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var m;function init_copy_to_clipboard$1(){return(init_copy_to_clipboard$1=e((()=>{m=a(),s(),t(),c(),u(),init_copy_to_clipboard(),init_copy_from_menu()})))()}init_copy_to_clipboard$1();export{MDXContent as default};