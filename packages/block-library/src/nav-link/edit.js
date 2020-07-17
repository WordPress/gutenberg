/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	BlockControls,
	RichText,
	InnerBlocks,
	__experimentalLinkControl as LinkControl,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { link as linkIcon } from '@wordpress/icons';
import { Popover, ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { ToolbarSubmenuIcon } from './icons';

export default function NavLinkEdit( {
	clientId,
	attributes: { label, url },
	setAttributes,
} ) {
	const { innerBlockClientIds, isParentOfSelectedBlock } = useSelect(
		( select ) => {
			const { getBlockOrder, hasSelectedInnerBlock } = select(
				'core/block-editor'
			);
			return {
				innerBlockClientIds: getBlockOrder( clientId ),
				isParentOfSelectedBlock: hasSelectedInnerBlock(
					clientId,
					true
				),
			};
		},
		[ clientId ]
	);

	const { selectBlock, insertBlock } = useDispatch( 'core/block-editor' );

	const [ isLinkOpen, setIsLinkOpen ] = useState( false );

	const insertSubmenu = () => {
		if ( innerBlockClientIds.length ) {
			selectBlock( innerBlockClientIds[ 0 ] );
		} else {
			insertBlock( createBlock( 'core/nav-submenu' ), 0, clientId );
		}
	};

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						name="link"
						icon={ linkIcon }
						title={ __( 'Link' ) }
						onClick={ () => setIsLinkOpen( true ) }
					/>
					<ToolbarButton
						name="submenu"
						icon={ <ToolbarSubmenuIcon /> }
						title={ __( 'Add submenu' ) }
						onClick={ insertSubmenu }
					/>
				</ToolbarGroup>
			</BlockControls>
			<Block.div
				className={ classnames( {
					'is-parent-of-selected-block': isParentOfSelectedBlock,
				} ) }
			>
				<RichText
					className="wp-block-nav-link__link"
					withoutInteractiveFormatting
					value={ label }
					onChange={ ( value ) => setAttributes( { label: value } ) }
				/>
				{ isLinkOpen && (
					<Popover
						position="bottom center"
						onClose={ () => setIsLinkOpen( false ) }
					>
						<LinkControl
							className="wp-block-nav-link__link-control"
							value={ url }
							showInitialSuggestions
							onChange={ setAttributes }
						/>
					</Popover>
				) }
				<InnerBlocks
					allowedBlocks={ [ 'core/nav-submenu' ] }
					__experimentalTagName={ 'div' }
				/>
			</Block.div>
		</>
	);
}
