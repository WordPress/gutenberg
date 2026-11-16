import clsx from 'clsx';
import {
	InspectorControls,
	useBlockEditingMode,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Button, PanelBody } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { safeHTML } from '@wordpress/dom';
import { ItemSubmenuIcon } from '../navigation-link/icons';
import {
	getColors,
	getNavigationChildBlockProps,
} from '../navigation/edit/utils';
import { DEFAULT_BLOCK } from '../navigation/constants';
import { usePageListAllowedBlocks } from '../page-list/use-page-list-allowed-blocks';

function useFrontPageId() {
	return useSelect( ( select ) => {
		const canReadSettings = select( coreStore ).canUser( 'read', {
			kind: 'root',
			name: 'site',
		} );
		if ( ! canReadSettings ) {
			return undefined;
		}

		const site = select( coreStore ).getEntityRecord( 'root', 'site' );
		return site?.show_on_front === 'page' && site?.page_on_front;
	}, [] );
}

export default function PageListItemEdit( { clientId, context, attributes } ) {
	const { id, label, link, title } = attributes;
	const isNavigationChild = 'showSubmenuIcon' in context;
	const frontPageId = useFrontPageId();

	// In a Navigation block, pages are moved, nested and hidden like its
	// other items, so a page's child pages follow the blocks, not the
	// attribute set when the blocks were made.
	const { hasChildren, pageListClientId } = useSelect(
		( select ) => {
			const { getBlockCount, getBlockParentsByBlockName } =
				select( blockEditorStore );
			return {
				hasChildren: getBlockCount( clientId ) > 0,
				pageListClientId: getBlockParentsByBlockName(
					clientId,
					'core/page-list',
					true
				)[ 0 ],
			};
		},
		[ clientId ]
	);
	const { selectBlock } = useDispatch( blockEditorStore );

	// Elsewhere, a Page List's pages can't be changed one by one, so clicking
	// one selects the Page List.
	useBlockEditingMode( isNavigationChild ? undefined : 'disabled' );
	const allowedBlocks = usePageListAllowedBlocks( isNavigationChild );

	// Get submenu visibility from context. The Navigation block handles
	// backward compatibility by migrating openSubmenusOnClick to submenuVisibility
	// via its deprecation handler before this context is received.
	const submenuVisibility = context.submenuVisibility;

	const openOnClick = submenuVisibility === 'click';

	const innerBlocksColors = getColors( context, true );

	const navigationChildBlockProps =
		getNavigationChildBlockProps( innerBlocksColors );
	const blockProps = useBlockProps( navigationChildBlockProps, {
		className: 'wp-block-pages-list__item',
	} );

	const innerBlocksProps = useInnerBlocksProps(
		blockProps,
		isNavigationChild
			? {
					renderAppender: false,
					allowedBlocks,
					defaultBlock: DEFAULT_BLOCK,
					directInsert: true,
				}
			: { allowedBlocks }
	);

	return (
		<>
			{ isNavigationChild && pageListClientId && (
				<InspectorControls>
					<PanelBody title={ __( 'Page List' ) }>
						<p>
							{ __(
								'This page is listed automatically, with your other pages. To show only the child pages of a page, or to turn the pages into links, select the Page List.'
							) }
						</p>
						<Button
							__next40pxDefaultSize
							variant="secondary"
							onClick={ () => selectBlock( pageListClientId ) }
						>
							{ __( 'Select Page List' ) }
						</Button>
					</PanelBody>
				</InspectorControls>
			) }
			<li
				key={ id }
				className={ clsx( 'wp-block-pages-list__item', {
					'has-child': hasChildren,
					'wp-block-navigation-item': isNavigationChild,
					// Class assignment logic matches PHP rendering in page-list/index.php
					'open-on-click': openOnClick,
					'open-always': submenuVisibility === 'always',
					// Must check hover mode explicitly to match PHP elseif structure (index.php:212)
					'open-on-hover-click':
						submenuVisibility === 'hover' &&
						context.showSubmenuIcon,
					'menu-item-home': id === frontPageId,
				} ) }
			>
				{ hasChildren && openOnClick ? (
					<>
						<button
							type="button"
							className="wp-block-navigation-item__content wp-block-navigation-submenu__toggle"
							aria-expanded="false"
							dangerouslySetInnerHTML={ {
								__html: safeHTML( label ),
							} }
						/>
						<span className="wp-block-page-list__submenu-icon wp-block-navigation__submenu-icon">
							<ItemSubmenuIcon />
						</span>
					</>
				) : (
					<a
						className={ clsx( 'wp-block-pages-list__item__link', {
							'wp-block-navigation-item__content':
								isNavigationChild,
						} ) }
						href={ link }
						dangerouslySetInnerHTML={ {
							__html: safeHTML( title ),
						} }
					/>
				) }
				{ hasChildren && (
					<>
						{ ! openOnClick && context.showSubmenuIcon && (
							<button
								className="wp-block-navigation-item__content wp-block-navigation-submenu__toggle wp-block-page-list__submenu-icon wp-block-navigation__submenu-icon"
								aria-expanded="false"
								type="button"
							>
								<ItemSubmenuIcon />
							</button>
						) }
						<ul { ...innerBlocksProps }></ul>
					</>
				) }
			</li>
		</>
	);
}
