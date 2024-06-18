/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Dropdown,
	Flex,
	FlexBlock,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';
import PostTypeSupportCheck from '../post-type-support-check';
import { store as editorStore } from '../../store';

function PageAttributesOrder() {
	const order = useSelect(
		( select ) =>
			select( editorStore ).getEditedPostAttribute( 'menu_order' ) ?? 0,
		[]
	);
	const { editPost } = useDispatch( editorStore );
	const [ orderInput, setOrderInput ] = useState( null );

	const setUpdatedOrder = ( value ) => {
		setOrderInput( value );
		const newOrder = Number( value );
		if ( Number.isInteger( newOrder ) && value.trim?.() !== '' ) {
			editPost( { menu_order: newOrder } );
		}
	};

	const value = orderInput ?? order;

	return (
		<Flex>
			<FlexBlock>
				<NumberControl
					__next40pxDefaultSize
					label={ __( 'Order' ) }
					help={ __( 'Set the page order.' ) }
					value={ value }
					onChange={ setUpdatedOrder }
					hideLabelFromVision
					onBlur={ () => {
						setOrderInput( null );
					} }
				/>
			</FlexBlock>
		</Flex>
	);
}

/**
 * Renders the Page Attributes Order component. A number input in an editor interface
 * for setting the order of a given page.
 *
 * @return {Component} The component to be rendered.
 */
export default function PageAttributesOrderWithChecks() {
	return (
		<PostTypeSupportCheck supportKeys="page-attributes">
			<PageAttributesOrder />
		</PostTypeSupportCheck>
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

export function OrderRow() {
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
						<div>
							{ __(
								'This attribute determines the order of pages in the Pages List block.'
							) }
							<p>
								{ __(
									'Pages with the same order value will sorted alphabetically. Negative order values are also supported.'
								) }
							</p>
						</div>
						<PageAttributesOrder />
					</div>
				) }
			/>
		</PostPanelRow>
	);
}
