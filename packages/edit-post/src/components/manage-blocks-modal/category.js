/**
 * External dependencies
 */
import { includes, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { cloneElement, Children } from '@wordpress/element';
import { ToggleControl, PanelBody } from '@wordpress/components';
import { __experimentalBlockTypesList as BlockTypesList } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

function BlockManagerCategory( {
	category,
	blockItems,
	hiddenBlockTypes,
	opened,
	onToggle,
	showBlockTypes,
	hideBlockTypes,
	toggleAllHidden,
} ) {
	if ( ! blockItems.length ) {
		return null;
	}

	const isAllHidden = blockItems.every( ( blockItem ) => {
		return hiddenBlockTypes.includes( blockItem.id );
	} );

	return (
		<PanelBody
			key={ category.slug }
			title={ category.title }
			icon={ category.icon }
			opened={ opened }
			onToggle={ onToggle }
		>
			<ToggleControl
				label={ __( 'Hide all blocks' ) }
				checked={ isAllHidden }
				onChange={ toggleAllHidden }
			/>
			<BlockTypesList
				items={ blockItems }
				onSelect={ ( item ) => (
					includes( hiddenBlockTypes, item.id ) ?
						showBlockTypes( item.id ) :
						hideBlockTypes( item.id )
				) }
				renderItem={ ( { children, item } ) => {
					const isHidden = includes( hiddenBlockTypes, item.id );
					if ( ! isHidden ) {
						return children;
					}

					const child = Children.only( children );
					return cloneElement( child, {
						'data-hidden': __( 'Hidden' ),
					} );
				} }
			/>
		</PanelBody>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const { getPreference } = select( 'core/edit-post' );

		return {
			hiddenBlockTypes: getPreference( 'hiddenBlockTypes' ),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const { blockItems } = ownProps;
		const {
			showBlockTypes,
			hideBlockTypes,
		} = dispatch( 'core/edit-post' );

		return {
			showBlockTypes,
			hideBlockTypes,
			toggleAllHidden( isToBeDisabled ) {
				const blockNames = map( blockItems, 'id' );
				if ( isToBeDisabled ) {
					hideBlockTypes( blockNames );
				} else {
					showBlockTypes( blockNames );
				}
			},
		};
	} ),
] )( BlockManagerCategory );
