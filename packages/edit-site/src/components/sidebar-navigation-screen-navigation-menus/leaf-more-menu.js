/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */

import { chevronUp, chevronDown, moreVertical } from '@wordpress/icons';
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { BlockTitle, store as blockEditorStore } from '@wordpress/block-editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import {
	isPreviewingTheme,
	currentlyPreviewingTheme,
} from '../../utils/is-previewing-theme';
import { unlock } from '../../lock-unlock';
import { getPathFromURL } from '../sync-state-with-url/use-sync-path-with-url';

const { useLocation, useHistory } = unlock( routerPrivateApis );

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

// TODO: double check if props passed to it are correct
export default function LeafMoreMenu( {
	toggleProps,
	label,
	icon,
	disableOpenOnArrowDown,
	block,
	// Unused (avoid forwarding with rest props)
	expand,
	expandedState,
	setInsertedBlock,
	// Rest props
	...props
} ) {
	const location = useLocation();
	const history = useHistory();
	const { clientId } = block;
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

	const rootClientId = useSelect(
		( select ) => {
			const { getBlockRootClientId } = select( blockEditorStore );

			return getBlockRootClientId( clientId );
		},
		[ clientId ]
	);

	const onGoToPage = useCallback(
		( selectedBlock ) => {
			const { attributes, name } = selectedBlock;
			if (
				attributes.kind === 'post-type' &&
				attributes.id &&
				attributes.type &&
				history
			) {
				history.push(
					{
						postType: attributes.type,
						postId: attributes.id,
						...( isPreviewingTheme() && {
							wp_theme_preview: currentlyPreviewingTheme(),
						} ),
					},
					{
						backPath: getPathFromURL( location.params ),
					}
				);
			}
			if ( name === 'core/page-list-item' && attributes.id && history ) {
				history.push(
					{
						postType: 'page',
						postId: attributes.id,
						...( isPreviewingTheme() && {
							wp_theme_preview: currentlyPreviewingTheme(),
						} ),
					},
					{
						backPath: getPathFromURL( location.params ),
					}
				);
			}
		},
		[ history ]
	);

	// Save the dropdownTriggerId in case it is enforced via toggleProps, so that
	// it can be passed as the value for the `aria-labelledby` prop for the
	// dropdown content. This would normally work out of the box for the
	// `DropdownMenu` component, but in this case the toggle may receive an
	// external id from the parent `ToolbarItem` that can't be ignored.
	const dropdownMenuExtraProps = {};

	if ( !! toggleProps?.id ) {
		dropdownMenuExtraProps[ 'aria-labelledby' ] = toggleProps?.id;
	}

	const dropdownMenuRef = useRef( null );

	return (
		<DropdownMenu
			ref={ dropdownMenuRef }
			trigger={
				<Button
					{ ...toggleProps }
					className={ classnames(
						'block-editor-block-settings-menu__trigger',
						toggleProps?.className
					) }
					onKeyDown={ ( event ) => {
						if (
							disableOpenOnArrowDown &&
							event.key === 'ArrowDown'
						) {
							event.preventDefault();
						}
						toggleProps?.onKeyDown?.( event );
					} }
					__next40pxDefaultSize
					label={ label ?? __( 'Options' ) }
					icon={ icon ?? moreVertical }
				/>
			}
			className="block-editor-block-settings-menu"
			placement="bottom-start"
			gutter={ 12 }
			{ ...dropdownMenuExtraProps }
			{ ...props }
		>
			<>
				<DropdownMenuGroup>
					<DropdownMenuItem
						icon={ chevronUp }
						onClick={ () => {
							moveBlocksUp( [ clientId ], rootClientId );
						} }
					>
						<DropdownMenuItemLabel>
							{ __( 'Move up' ) }
						</DropdownMenuItemLabel>
					</DropdownMenuItem>
					<DropdownMenuItem
						icon={ chevronDown }
						onClick={ () => {
							moveBlocksDown( [ clientId ], rootClientId );
						} }
					>
						<DropdownMenuItemLabel>
							{ __( 'Move down' ) }
						</DropdownMenuItemLabel>
					</DropdownMenuItem>
					{ block.attributes?.type === 'page' &&
						block.attributes?.id && (
							<DropdownMenuItem
								onClick={ () => {
									onGoToPage( block );
								} }
							>
								<DropdownMenuItemLabel>
									{ goToLabel }
								</DropdownMenuItemLabel>
							</DropdownMenuItem>
						) }
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						onClick={ () => {
							removeBlocks( [ clientId ], false );
						} }
					>
						<DropdownMenuItemLabel>
							{ removeLabel }
						</DropdownMenuItemLabel>
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</>
		</DropdownMenu>
	);
}
