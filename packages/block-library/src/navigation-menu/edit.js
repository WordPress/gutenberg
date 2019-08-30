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
	IconButton,
	SVG,
	Path,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { __ } from '@wordpress/i18n';

const NavigatorIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
		<Path d="M5 5H3v2h2V5zm3 8h11v-2H8v2zm9-8H6v2h11V5zM7 11H5v2h2v-2zm0 8h2v-2H7v2zm3-2v2h11v-2H10z" />
	</SVG>
);

function NavigationMenu( {
	attributes,
	setAttributes,
} ) {
	return (
		<Fragment>
			<BlockControls>
				<Toolbar>
					<IconButton
						className="components-toolbar__control"
						label={ __( 'View navigator' ) }
						onClick={ () => {} }
						icon={ NavigatorIcon }
					/>
				</Toolbar>
			</BlockControls>
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
					renderAppender={ InnerBlocks.ButtonBlockAppender }
				/>
			</div>
		</Fragment>
	);
}

export default NavigationMenu;
