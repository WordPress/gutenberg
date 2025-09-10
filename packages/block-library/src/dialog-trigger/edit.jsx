/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef, useMemo } from '@wordpress/element';
import { BlockControls, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';

/**
 * Internal Dependencies
 */

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props               Properties passed to the function.
 * @param {Object}   props.attributes    Available block attributes.
 * @param            props.context
 * @param            props.clientId
 * @param            props.isSelected
 * @param {Function} props.setAttributes Function that updates individual attributes.
 *
 * @return {WPElement} Element to render.
 */
export default function Edit({
	attributes,
	context,
}) {
	const dialogId = context['dialog/id'] ?? null;
	const blockProps = useBlockProps({
		'aria-haspopup': 'dialog',
		'aria-controls': dialogId,
		'aria-expanded': '',
		'type': 'button',

	});
	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		templateLock: false,
	});

	return (
		<>
			<button {...innerBlocksProps} />
		</>
	);
}
