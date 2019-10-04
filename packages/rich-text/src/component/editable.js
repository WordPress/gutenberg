/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Content from './content';

function Editable( {
	tagName: TagName = 'div',
	style = {},
	value,
	forwardedRef,
	multilineTag,
	multilineWrapperTags,
	placeholder,
	prepareEditableTree,
	...remainingProps
} ) {
	// In HTML, leading and trailing spaces are not visible, and multiple
	// spaces elsewhere are visually reduced to one space. This rule
	// prevents spaces from collapsing so all space is visible in the editor
	// and can be removed.
	// It also prevents some browsers from inserting non-breaking spaces at
	// the end of a line to prevent the space from visually disappearing.
	// Sometimes these non breaking spaces can linger in the editor causing
	// unwanted non breaking spaces in between words. If also prevent
	// Firefox from inserting a trailing `br` node to visualise any trailing
	// space, causing the element to be saved.
	//
	// > Authors are encouraged to set the 'white-space' property on editing
	// > hosts and on markup that was originally created through these
	// > editing mechanisms to the value 'pre-wrap'. Default HTML whitespace
	// > handling is not well suited to WYSIWYG editing, and line wrapping
	// > will not work correctly in some corner cases if 'white-space' is
	// > left at its default value.
	// >
	// > https://html.spec.whatwg.org/multipage/interaction.html#best-practices-for-in-page-editors
	const whiteSpace = 'pre-wrap';

	return (
		<TagName
			role="textbox"
			aria-multiline
			aria-label={ placeholder }
			contentEditable
			suppressContentEditableWarning
			ref={ forwardedRef }
			style={ { ...style, whiteSpace } }
			{ ...remainingProps }
		>
			<Content
				value={ value }
				multilineTag={ multilineTag }
				multilineWrapperTags={ multilineWrapperTags }
				placeholder={ placeholder }
				prepareEditableTree={ prepareEditableTree }
			/>
		</TagName>
	);
}

export default forwardRef( ( props, ref ) => {
	return <Editable { ...props } forwardedRef={ ref } />;
} );
