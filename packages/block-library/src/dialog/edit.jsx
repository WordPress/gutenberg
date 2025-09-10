/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef, useMemo } from '@wordpress/element';
import {
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';

/**
 * Internal Dependencies
 */
const TEMPLATE = [
	['prc-block/dialog-trigger', {
		"lock": {
			"move": true,
			"remove": false
		}
	}, [
		[
			'core/paragraph', { placeholder: __('Start typing to add Dialog trigger text...') }
		]
	]],
	['prc-block/dialog-element', {
		dialogType: 'modal',
		"lock": {
			"move": true,
			"remove": true
		}
	}, [
		[
			'core/heading', {
				 level: 2,
				 placeholder: __('Add a dialog label...'),
				 metadata: {
					bindings: {
						content: {
							source: 'prc-block/dialog-element-label',
						},
					},
				 }
			}
		]
	]],
];

const ALLOWED_BLOCKS = ['prc-block/dialog-trigger', 'prc-block/dialog-element'];

export default function Edit({
	attributes,
	setAttributes,
	context,
	clientId,
	isSelected,
}) {
	// add dialog id attribute to the block
	const { dialogId } = attributes;
	if (!dialogId) {
		setAttributes({ dialogId: clientId });
	}
	// Set up a ref so that we can query for the dialog element and memoize it.
	const ref = useRef(null);
	const dialogElm = useMemo(() => {
		return (
			ref.current?.querySelector('.wp-block-prc-block-dialog-element') ||
			null
		);
	}, [ref, ref.current]);
	const isModal = useMemo(() => {
		return dialogElm?.getAttribute('aria-modal') === 'true';
	}, [dialogElm]);

	const blockProps = useBlockProps({
		ref,
	});

	// We're locking down the template and allowed blocks to only allow the dialog trigger and dialog element.
	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		template: TEMPLATE,
		templateLock: 'insert',
	});

	const buttonLabel = useMemo(
		() => (dialogElm?.open ? __('Close Dialog') : __('Edit Dialog')),
		[dialogElm]
	);

	return (
		<>
			<BlockControls __experimentalShareWithChildBlocks={true}>
				<ToolbarGroup>
					<ToolbarButton
						label={buttonLabel}
						onClick={() => {
							if (!dialogElm) {
								console.warn('No dialog element found.');
								return;
							}
							if (isModal) {
								dialogElm.showModal();
							} else {
								dialogElm.show();
							}
						}}
					>
						{buttonLabel}
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<div {...innerBlocksProps} />
		</>
	);
}
