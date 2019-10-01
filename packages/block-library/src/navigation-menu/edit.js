/**
 * WordPress dependencies
 */
import {
	Fragment,
} from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
	BlockControls,
} from '@wordpress/block-editor';
import {
	CheckboxControl,
	PanelBody,
	Toolbar,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useBlockNavigator from './use-block-navigator';

function NavigationMenu( {
	attributes,
	setAttributes,
	clientId,
} ) {
	const { navigatorToolbarButton, navigatorModal } = useBlockNavigator( clientId );

	return (
		<Fragment>
			<BlockControls>
				<Toolbar>
					{ navigatorToolbarButton }
				</Toolbar>
			</BlockControls>
			{ navigatorModal }
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
			</div>
		</Fragment>
	);
}

export default NavigationMenu;
