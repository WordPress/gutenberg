/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Flex,
	FlexBlock,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
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
					value={ value }
					onChange={ setUpdatedOrder }
					labelPosition="side"
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
