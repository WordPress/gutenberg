/**
 * WordPress dependencies
 */
import {
	__experimentalBlock as Block,
	InnerBlocks,
	BlockControls,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { ToolbarGroup } from '@wordpress/components';

export default function NavSubmenuEdit( {
	attributes: { width },
	setAttributes,
} ) {
	return (
		<>
			<BlockControls>
				<ToolbarGroup
					isCollapsed
					controls={ [
						{
							title: __( 'Narrow width' ),
							isActive: width === 'narrow',
							onClick() {
								setAttributes( { width: 'narrow' } );
							},
						},
						{
							title: __( 'Wide width' ),
							isActive: width === 'wide',
							onClick() {
								setAttributes( { width: 'wide' } );
							},
						},
						{
							title: __( 'Full width' ),
							isActive: width === 'full',
							onClick() {
								setAttributes( { width: 'full' } );
							},
						},
					] }
				/>
			</BlockControls>
			<InnerBlocks
				__experimentalTagName={ Block.div }
				__experimentalPassedProps={ { className: `width-${ width }` } }
			/>
		</>
	);
}
