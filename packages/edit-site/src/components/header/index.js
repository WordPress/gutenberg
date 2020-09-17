/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import {
	BlockNavigationDropdown,
	ToolSelector,
	BlockToolbar,
	__experimentalPreviewOptions as PreviewOptions,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	PinnedItems,
	__experimentalMainDashboardButton as MainDashboardButton,
} from '@wordpress/interface';
import { _x } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { useState, useEffect, useMemo } from '@wordpress/element';
import {
	__experimentalGetBlockLabel as getBlockLabel,
	getBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import MoreMenu from './more-menu';
import PageSwitcher from '../page-switcher';
import TemplateSwitcher from '../template-switcher';
import SaveButton from '../save-button';
import UndoButton from './undo-redo/undo';
import RedoButton from './undo-redo/redo';
import FullscreenModeClose from './fullscreen-mode-close';

export default function Header( {
	openEntitiesSavedStates,
	isInserterOpen,
	onToggleInserter,
} ) {
	const {
		deviceType,
		hasFixedToolbar,
		templateId,
		templatePartId,
		templateType,
		page,
		showOnFront,
	} = useSelect( ( select ) => {
		const {
			__experimentalGetPreviewDeviceType,
			isFeatureActive,
			getTemplateId,
			getTemplatePartId,
			getTemplateType,
			getPage,
		} = select( 'core/edit-site' );

		const { show_on_front: _showOnFront } = select(
			'core'
		).getEditedEntityRecord( 'root', 'site' );

		return {
			deviceType: __experimentalGetPreviewDeviceType(),
			hasFixedToolbar: isFeatureActive( 'fixedToolbar' ),
			templateId: getTemplateId(),
			templatePartId: getTemplatePartId(),
			templateType: getTemplateType(),
			page: getPage(),
			showOnFront: _showOnFront,
		};
	}, [] );

	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
		setTemplate,
		addTemplate,
		removeTemplate,
		setTemplatePart,
		setPage,
	} = useDispatch( 'core/edit-site' );

	const isLargeViewport = useViewportMatch( 'medium' );
	const displayBlockToolbar =
		! isLargeViewport || deviceType !== 'Desktop' || hasFixedToolbar;

	// Track mouse location.
	const [ mouseLoc, setMouseLoc ] = useState( { x: 0, y: 0 } );
	useEffect( () => {
		const setMouseLocFromEvent = ( event ) =>
			setMouseLoc( { x: event.clientX, y: event.clientY } );

		window.addEventListener( 'mousemove', setMouseLocFromEvent );

		return () => {
			window.removeEventListener( 'mousemove', setMouseLocFromEvent );
		};
	}, [] );

	// See if a template part is hovered when mouse moves.
	const hoveredTemplatePart = useMemo( () => {
		const hoveredElements = document.elementsFromPoint(
			mouseLoc.x,
			mouseLoc.y
		);
		// NOTE: this find may prioritize top-down, we may want the opposite.
		const templatePart = hoveredElements.find(
			( element ) => element.dataset?.type === 'core/template-part'
		);
		return templatePart ? templatePart.dataset.block : '';
	}, [ mouseLoc.x, mouseLoc.y ] );

	// Get label when hovered template part changes.
	const getBlock = useSelect(
		( select ) => select( 'core/block-editor' ).getBlock
	);
	const hoverLabel = useMemo( () => {
		const block = getBlock( hoveredTemplatePart );
		return (
			block &&
			getBlockLabel( getBlockType( block.name ), block.attributes )
		);
	}, [ hoveredTemplatePart ] );

	return (
		<>
			<div className="edit-site-header">{ hoverLabel }</div>
			<div className="edit-site-header">
				<MainDashboardButton.Slot>
					<FullscreenModeClose />
				</MainDashboardButton.Slot>
				<div className="edit-site-header__toolbar">
					<Button
						isPrimary
						isPressed={ isInserterOpen }
						className="edit-site-header-toolbar__inserter-toggle"
						onClick={ onToggleInserter }
						icon={ plus }
						label={ _x(
							'Add block',
							'Generic label for block inserter button'
						) }
					/>
					<ToolSelector />
					<UndoButton />
					<RedoButton />
					<BlockNavigationDropdown />
					{ displayBlockToolbar && (
						<div className="edit-site-header-toolbar__block-toolbar">
							<BlockToolbar hideDragHandle />
						</div>
					) }
					<div className="edit-site-header__toolbar-switchers">
						<PageSwitcher
							showOnFront={ showOnFront }
							activePage={ page }
							onActivePageChange={ setPage }
						/>
						<div className="edit-site-header__toolbar-switchers-separator">
							/
						</div>
						<TemplateSwitcher
							page={ page }
							activeId={ templateId }
							activeTemplatePartId={ templatePartId }
							isTemplatePart={
								templateType === 'wp_template_part'
							}
							onActiveIdChange={ setTemplate }
							onActiveTemplatePartIdChange={ setTemplatePart }
							onAddTemplate={ addTemplate }
							onRemoveTemplate={ removeTemplate }
						/>
					</div>
				</div>
				<div className="edit-site-header__actions">
					<PreviewOptions
						deviceType={ deviceType }
						setDeviceType={ setPreviewDeviceType }
					/>
					<SaveButton
						openEntitiesSavedStates={ openEntitiesSavedStates }
					/>
					<PinnedItems.Slot scope="core/edit-site" />
					<MoreMenu />
				</div>
			</div>
		</>
	);
}
