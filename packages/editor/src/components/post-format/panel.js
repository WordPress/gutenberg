/**
 * WordPress dependencies
 */
import { Button, Dropdown } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { default as PostFormatForm, POST_FORMATS } from './';
import PostFormatCheck from './check';
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';

/**
 * Renders the Post Author Panel component.
 *
 * @return {React.ReactNode} The rendered component.
 */
function PostFormat() {
	const { postFormat } = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		const _postFormat = getEditedPostAttribute( 'format' );
		return {
			postFormat: _postFormat ?? 'standard',
		};
	}, [] );
	const activeFormat = POST_FORMATS.find(
		( format ) => format.id === postFormat
	);

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			// Anchor the popover to the middle of the entire row so that it doesn't
			// move around when the label changes.
			anchor: popoverAnchor,
			placement: 'left-start',
			offset: 36,
			shift: true,
		} ),
		[ popoverAnchor ]
	);
	return (
		<PostFormatCheck>
			<PostPanelRow label={ __( 'Format' ) } ref={ setPopoverAnchor }>
				<Dropdown
					popoverProps={ popoverProps }
					contentClassName="editor-post-format__dialog"
					focusOnMount
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Button
							size="compact"
							variant="tertiary"
							aria-expanded={ isOpen }
							aria-label={ sprintf(
								// translators: %s: Current post format.
								__( 'Change format: %s' ),
								activeFormat?.caption
							) }
							onClick={ onToggle }
						>
							{ activeFormat?.caption }
						</Button>
					) }
					renderContent={ ( { onClose } ) => (
						<div className="editor-post-format__dialog-content">
							<InspectorPopoverHeader
								title={ __( 'Format' ) }
								onClose={ onClose }
							/>
							<PostFormatForm />
						</div>
					) }
				/>
			</PostPanelRow>
		</PostFormatCheck>
	);
}

export default PostFormat;
