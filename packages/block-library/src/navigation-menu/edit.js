/**
 * External dependencies
 */
import { get, map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Fragment,
	useEffect,
	useRef,
} from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	CheckboxControl,
	PanelBody,
} from '@wordpress/components';
import {
	withDispatch,
	withSelect,
} from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import MenuItemInserter from './menu-item-inserter';
import { __ } from '@wordpress/i18n';

function NavigationMenu( {
	attributes,
	clientId,
	hasChildBlocks,
	insertChilds,
	isSelected,
	setAttributes,
	topLevelPages,
} ) {
	const mayAddMenuItems = useRef( true );
	// Add menu items based on top level pages if menu items are empty, and did not had content before.
	useEffect(
		() => {
			// Avoid adding menu items again if the user just removed them.
			if ( hasChildBlocks ) {
				if ( mayAddMenuItems.current ) {
					mayAddMenuItems.current = false;
				}
				return;
			}
			if ( ! mayAddMenuItems.current || ! topLevelPages || ! topLevelPages.length ) {
				return;
			}
			insertChilds(
				map( topLevelPages, ( page ) => (
					createBlock( 'core/navigation-menu-item', {
						destination: page.link,
						label: get( page, [ 'title', 'rendered' ] ),
					} )
				) )
			);
			// Make sure we don't readd the menu items again to avoid undo traps.
			mayAddMenuItems.current = false;
		},
		[
			hasChildBlocks,
			insertChilds,
			topLevelPages,
		]
	);
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

export default compose( [
	withSelect( ( select, props ) => {
		const { clientId } = props;
		const { getBlockCount } = select( 'core/block-editor' );
		const hasChildBlocks = !! getBlockCount( clientId );
		let topLevelPages;
		if ( ! hasChildBlocks ) {
			const { getEntityRecords } = select( 'core' );
			const topLevelPagesQuery = {
				parent: 0,
			};
			topLevelPages = getEntityRecords( 'postType', 'page', topLevelPagesQuery );
		}

		return {
			hasChildBlocks,
			topLevelPages,
		};
	} ),
	withDispatch( ( dispatch, props ) => {
		return {
			insertChilds( childBlocks ) {
				const {	insertBlocks } = dispatch( 'core/block-editor' );
				insertBlocks( childBlocks, 0, props.clientId );
			},
		};
	} ),
] )( NavigationMenu );
