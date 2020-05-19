/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import {
	BlockNavigationDropdown,
	ToolSelector,
	__experimentalPreviewOptions as PreviewOptions,
} from '@wordpress/block-editor';
import {
	__experimentalResolveSelect as resolveSelect,
	useSelect,
	useDispatch,
} from '@wordpress/data';
import {
	PinnedItems,
	__experimentalMainDashboardButton as MainDashboardButton,
} from '@wordpress/interface';
import { _x } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useEditorContext } from '../editor';
import MoreMenu from './more-menu';
import PageSwitcher from '../page-switcher';
import TemplateSwitcher from '../template-switcher';
import SaveButton from '../save-button';
import UndoButton from './undo-redo/undo';
import RedoButton from './undo-redo/redo';
import FullscreenModeClose from './fullscreen-mode-close';

/**
 * Browser dependencies
 */
const { fetch } = window;

export default function Header( {
	openEntitiesSavedStates,
	isInserterOpen,
	onToggleInserter,
} ) {
	const { settings, setSettings } = useEditorContext();
	const setActiveTemplateId = useCallback(
		( newTemplateId ) =>
			setSettings( ( prevSettings ) => ( {
				...prevSettings,
				templateId: newTemplateId,
				templateType: 'wp_template',
			} ) ),
		[]
	);
	const setActiveTemplatePartId = useCallback(
		( newTemplatePartId ) =>
			setSettings( ( prevSettings ) => ( {
				...prevSettings,
				templateId: newTemplatePartId,
				templateType: 'wp_template_part',
			} ) ),
		[]
	);
	const addTemplateId = useCallback(
		( newTemplateId ) =>
			setSettings( ( prevSettings ) => ( {
				...prevSettings,
				templateId: newTemplateId,
				templateIds: [ ...prevSettings.templateIds, newTemplateId ],
			} ) ),
		[]
	);
	const setActivePage = useCallback( async ( newPage ) => {
		try {
			const { success, data } = await fetch(
				addQueryArgs( newPage.path, { '_wp-find-template': true } )
			).then( ( res ) => res.json() );
			if ( success ) {
				let newTemplateId = data.ID;
				if ( newTemplateId === null ) {
					newTemplateId = (
						await resolveSelect( 'core' ).getEntityRecords(
							'postType',
							'wp_template',
							{
								resolved: true,
								slug: data.post_name,
							}
						)
					 )[ 0 ].id;
				}
				setSettings( ( prevSettings ) => ( {
					...prevSettings,
					page: newPage,
					templateId: newTemplateId,
				} ) );
			}
		} catch ( err ) {}
	}, [] );

	const deviceType = useSelect( ( select ) => {
		return select( 'core/edit-site' ).__experimentalGetPreviewDeviceType();
	}, [] );

	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
	} = useDispatch( 'core/edit-site' );

	return (
		<div className="edit-site-header">
			<MainDashboardButton.Slot>
				<FullscreenModeClose />
			</MainDashboardButton.Slot>
			<div className="edit-site-header__toolbar">
				<Button
					className="edit-site-header-toolbar__inserter-toggle"
					isPrimary
					isPressed={ isInserterOpen }
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
				<PageSwitcher
					showOnFront={ settings.showOnFront }
					activePage={ settings.page }
					onActivePageChange={ setActivePage }
				/>
				<TemplateSwitcher
					ids={ settings.templateIds }
					templatePartIds={ settings.templatePartIds }
					activeId={ settings.templateId }
					homeId={ settings.homeTemplateId }
					isTemplatePart={
						settings.templateType === 'wp_template_part'
					}
					onActiveIdChange={ setActiveTemplateId }
					onActiveTemplatePartIdChange={ setActiveTemplatePartId }
					onAddTemplateId={ addTemplateId }
				/>
				<BlockNavigationDropdown />
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
	);
}
