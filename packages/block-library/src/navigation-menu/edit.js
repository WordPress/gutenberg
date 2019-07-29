/**
 * WordPress dependencies
 */
import {
	Fragment,
} from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	CheckboxControl,
	PanelBody,
} from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { __ } from '@wordpress/i18n';

function NavigationMenu( {
	attributes,
	clientId,
	setAttributes,
	getBlockInnerHierarchy,
} ) {
	const onChange = () => {
		setAttributes( { hierarchy: getBlockInnerHierarchy( clientId ) } );
	};

	return (
		<Fragment>
			<InspectorControls>
				<PanelBody
					title={ __( 'Menu Settings' ) }
				>
					<CheckboxControl
						value={ attributes.automaticallyAdd }
						onChange={ ( automaticallyAdd ) => {
							setAttributes( { automaticallyAdd } );
						} }
						label={ __( 'Automatically add new pages' ) }
						help={ __( 'Automatically add new top level pages to this menu.' ) }
					/>
					<CheckboxControl
						value={ false }
						onChange={ onChange }
						label={ __( 'Set Tree' ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div className="wp-block-navigation-menu">
				<InnerBlocks
					allowedBlocks={ [ 'core/navigation-menu-item' ] }
					renderAppender={ InnerBlocks.ButtonBlockAppender }
				/>
			</div>
		</Fragment>
	);
}

export default compose(
	withSelect( ( select ) => {
		const {
			getBlock,
		} = select( 'core/block-editor' );
		/**
		 * Given a block client ID, returns the nested hierarchy from the given block, return the block itself for root level blocks.
		 *
		 * @param {string} clientId Block from which to find hierarchy.
		 *
		 * @return {Array} Hierarchy of menu item blocks
		 */
		const getBlockInnerHierarchy = ( clientId ) => {
			const block = getBlock( clientId );
			const getBlockChildren = ( innerBlock ) => {
				return {
					label: innerBlock.attributes.label,
					destination: innerBlock.attributes.destination,
					submenu: innerBlock.innerBlocks.map( getBlockChildren ),
				};
			};
			return block.innerBlocks.map( getBlockChildren );
		};
		return {
			getBlockInnerHierarchy,
		};
	} )
)( NavigationMenu );
