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

/**
 * Internal dependencies
 */
import MenuItemInserter from './menu-item-inserter';
import { __ } from '@wordpress/i18n';

function NavigationMenu( {
	attributes,
	clientId,
	isSelected,
	setAttributes,
} ) {
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
				</PanelBody>
			</InspectorControls>
			<div className="wp-block-navigation-menu">
				<InnerBlocks
					allowedBlocks={ [ 'core/navigation-menu-item' ] }
				/>
				{ isSelected && (
					<MenuItemInserter
						rootClientId={ clientId }
					/>
				) }
			</div>
		</Fragment>
	);
}

export default NavigationMenu;
