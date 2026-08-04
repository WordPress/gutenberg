/**
 * WordPress dependencies
 */

import { chevronUp, chevronDown, moreVertical } from '@wordpress/icons';
import { DropdownMenu, MenuItem, MenuGroup } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { BlockTitle, store as blockEditorStore } from '@wordpress/block-editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';

const POPOVER_PROPS = {
	className: 'block-editor-block-settings-menu__popover',
	placement: 'bottom-start',
};

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory, useLocation } = unlock( routerPrivateApis );

export default function LeafMoreMenu( props ) {
	const history = useHistory();
	const { path } = useLocation();
	const { clientId } = props;
	const { moveBlocksDown, moveBlocksUp, removeBlocks } =
		useDispatch( blockEditorStore );

	const removeLabel = sprintf(
		/* translators: %s: block name */
		__( 'Remove %s' ),
		BlockTitle( { clientId, maximumLength: 25 } )
	);

	const goToLabel = sprintf(
		/* translators: %s: block name */
		__( 'Go to %s' ),
		BlockTitle( { clientId, maximumLength: 25 } )
	);

	const { rootClientId, blockName, attributes } = useSelect(
		( select ) => {
			const { getBlockRootClientId, getBlockName, getBlockAttributes } =
				select( blockEditorStore );

			return {
				rootClientId: getBlockRootClientId( clientId ),
				blockName: getBlockName( clientId ),
				attributes: getBlockAttributes( clientId ),
			};
		},
		[ clientId ]
	);

	const onGoToPage = useCallback( () => {
		if (
			attributes.kind === 'post-type' &&
			attributes.id &&
			attributes.type &&
			history
		) {
			history.navigate(
				`/${ attributes.type }/${ attributes.id }?canvas=edit`,
				{
					state: { backPath: path },
				}
			);
		}
		if ( blockName === 'core/page-list-item' && attributes.id && history ) {
			history.navigate( `/page/${ attributes.id }?canvas=edit`, {
				state: { backPath: path },
			} );
		}
	}, [ path, history, attributes, blockName ] );

	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Options' ) }
			className="block-editor-block-settings-menu"
			popoverProps={ POPOVER_PROPS }
			noIcons
			{ ...props }
		>
			{ ( { onClose } ) => (
				<>
					<MenuGroup>
						<MenuItem
							icon={ chevronUp }
							onClick={ () => {
								moveBlocksUp( [ clientId ], rootClientId );
								onClose();
							} }
						>
							{ __( 'Move up' ) }
						</MenuItem>
						<MenuItem
							icon={ chevronDown }
							onClick={ () => {
								moveBlocksDown( [ clientId ], rootClientId );
								onClose();
							} }
						>
							{ __( 'Move down' ) }
						</MenuItem>
						{ attributes?.type === 'page' && attributes?.id && (
							<MenuItem
								onClick={ () => {
									onGoToPage();
									onClose();
								} }
							>
								{ goToLabel }
							</MenuItem>
						) }
					</MenuGroup>
					<MenuGroup>
						<MenuItem
							onClick={ () => {
								removeBlocks( [ clientId ], false );
								onClose();
							} }
						>
							{ removeLabel }
						</MenuItem>
					</MenuGroup>
				</>
			) }
		</DropdownMenu>
	);
}
