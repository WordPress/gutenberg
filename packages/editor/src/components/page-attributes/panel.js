/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Dropdown, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';
import PageAttributesCheck from './check';
import PageAttributesOrder from './order';
import PageAttributesParent from './parent';

const PANEL_NAME = 'page-attributes';

function getTitle( post ) {
	return post?.title?.rendered
		? decodeEntities( post.title.rendered )
		: `#${ post.id } (${ __( 'no title' ) })`;
}

function PostParentToggle( { isOpen, onClick } ) {
	const parentPost = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		const parentPostId = getEditedPostAttribute( 'parent' );
		if ( ! parentPostId ) {
			return null;
		}
		const { getEntityRecord } = select( coreStore );
		const postTypeSlug = getEditedPostAttribute( 'type' );
		return getEntityRecord( 'postType', postTypeSlug, parentPostId );
	}, [] );
	const parentTitle = useMemo(
		() => ( ! parentPost ? __( 'None' ) : getTitle( parentPost ) ),
		[ parentPost ]
	);
	return (
		<Button
			size="compact"
			className="editor-post-parent__panel-toggle"
			variant="tertiary"
			aria-expanded={ isOpen }
			// translators: %s: Current post parent.
			aria-label={ sprintf( __( 'Change parent: %s' ), parentTitle ) }
			onClick={ onClick }
		>
			{ parentTitle }
		</Button>
	);
}

function PostOrderToggle( { isOpen, onClick } ) {
	const order = useSelect(
		( select ) =>
			select( editorStore ).getEditedPostAttribute( 'menu_order' ) ?? 0,
		[]
	);
	return (
		<Button
			size="compact"
			className="editor-post-order__panel-toggle"
			variant="tertiary"
			aria-expanded={ isOpen }
			// translators: %s: Current post parent.
			aria-label={ sprintf( __( 'Change order: %s' ), order ) }
			onClick={ onClick }
		>
			{ order }
		</Button>
	);
}

function ParentRow() {
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
		<PostPanelRow label={ __( 'Parent' ) } ref={ setPopoverAnchor }>
			<Dropdown
				popoverProps={ popoverProps }
				className="editor-post-parent__panel-dropdown"
				contentClassName="editor-post-parent__panel-dialog"
				focusOnMount
				renderToggle={ ( { isOpen, onToggle } ) => (
					<PostParentToggle isOpen={ isOpen } onClick={ onToggle } />
				) }
				renderContent={ ( { onClose } ) => (
					<div className="editor-post-parent">
						<InspectorPopoverHeader
							title={ __( 'Parent' ) }
							onClose={ onClose }
						/>
						<PageAttributesParent />
					</div>
				) }
			/>
		</PostPanelRow>
	);
}

function OrderRow() {
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
		<PostPanelRow label={ __( 'Order' ) } ref={ setPopoverAnchor }>
			<Dropdown
				popoverProps={ popoverProps }
				className="editor-post-order__panel-dropdown"
				contentClassName="editor-post-order__panel-dialog"
				focusOnMount
				renderToggle={ ( { isOpen, onToggle } ) => (
					<PostOrderToggle isOpen={ isOpen } onClick={ onToggle } />
				) }
				renderContent={ ( { onClose } ) => (
					<div className="editor-post-order">
						<InspectorPopoverHeader
							title={ __( 'Order' ) }
							onClose={ onClose }
						/>
						<PageAttributesOrder />
					</div>
				) }
			/>
		</PostPanelRow>
	);
}

function AttributesPanel() {
	const { isEnabled, postType } = useSelect( ( select ) => {
		const { getEditedPostAttribute, isEditorPanelEnabled } =
			select( editorStore );
		const { getPostType } = select( coreStore );
		return {
			isEnabled: isEditorPanelEnabled( PANEL_NAME ),
			postType: getPostType( getEditedPostAttribute( 'type' ) ),
		};
	}, [] );

	if ( ! isEnabled || ! postType ) {
		return null;
	}

	return (
		<>
			<ParentRow />
			<OrderRow />
		</>
	);
}

/**
 * Renders the Page Attributes Panel component.
 *
 * @return {Component} The component to be rendered.
 */
export default function PageAttributesPanel() {
	return (
		<PageAttributesCheck>
			<AttributesPanel />
		</PageAttributesCheck>
	);
}
