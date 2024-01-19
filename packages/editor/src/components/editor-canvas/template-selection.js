/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { Fill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import TemplateToolbar from '../template-toolbar';

// This CSS is adapted from block-list/content.scss in the block-editor package.
// TODO: Should we re-use the existing CSS there by allowing it to target .is-root-container?
const HOVERING_CSS = `
.is-root-container::after {
	content: "";
	position: absolute;
	pointer-events: none;
	top: 1px;
	left: 1px;
	right: 1px;
	bottom: 1px;
	box-shadow: 0 0 0 1px var(--wp-block-synced-color);
	border-radius: 1px;
}
`;
const SELECTED_CSS = `
.is-root-container::after {
	content: "";
	position: absolute;
	pointer-events: none;
	top: 1px;
	left: 1px;
	right: 1px;
	bottom: 1px;
	box-shadow: 0 0 0 var(--wp-admin-border-width-focus) var(--wp-block-synced-color);
	border-radius: 1px;
}
`;

export default function TemplateSelection( { canvasRef } ) {
	const [ isHovering, setIsHovering ] = useState( false );
	const [ isSelected, setIsSelected ] = useState( false );

	useEffect( () => {
		const handleMouseOver = ( event ) => {
			setIsHovering(
				event.target.classList.contains( 'is-root-container' )
			);
		};

		const handleMouseOut = () => {
			setIsHovering( false );
		};

		const handleClick = async ( event ) => {
			setIsSelected(
				event.target.classList.contains( 'is-root-container' )
			);
		};

		const canvas = canvasRef.current;
		canvas?.addEventListener( 'mouseover', handleMouseOver );
		canvas?.addEventListener( 'mouseout', handleMouseOut );
		canvas?.addEventListener( 'click', handleClick );
		return () => {
			canvas?.removeEventListener( 'mouseover', handleMouseOver );
			canvas?.removeEventListener( 'mouseout', handleMouseOut );
			canvas?.removeEventListener( 'click', handleClick );
		};
	}, [ canvasRef, isSelected ] );

	let css = '';
	if ( isSelected ) {
		css = SELECTED_CSS;
	} else if ( isHovering ) {
		css = HOVERING_CSS;
	}

	return (
		<>
			<style>{ css }</style>
			{ isSelected && (
				<Fill name="block-toolbar">
					<TemplateToolbar />
				</Fill>
			) }
		</>
	);
}
