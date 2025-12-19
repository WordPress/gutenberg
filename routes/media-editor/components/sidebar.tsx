/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import {
	forwardRef,
	useState,
	useContext,
	useCallback,
	Platform,
} from '@wordpress/element';
import {
	ComplementaryArea,
	store as interfaceStore,
} from '@wordpress/interface';
import { cog } from '@wordpress/icons';
import {
	altTextField,
	captionField,
	descriptionField,
	filenameField,
	filesizeField,
	mediaDimensionsField,
	mimeTypeField,
} from '@wordpress/media-fields';
import { MediaEditorProvider, MediaForm } from '@wordpress/media-editor';
import type { Media, Field } from '@wordpress/media-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import PostCardPanel from './post-card-panel';

const { Tabs } = unlock( componentsPrivateApis );

const MEDIA_FIELDS: Field< Media >[] = [
	filenameField,
	filesizeField,
	mediaDimensionsField,
	mimeTypeField,
	altTextField,
	captionField,
	descriptionField,
].filter( Boolean );

const SIDEBAR_ACTIVE_BY_DEFAULT = Platform.select( {
	web: true,
} );

interface SidebarProps {
	postId: string;
}

const SidebarHeader = forwardRef( ( _props, ref ) => {
	return (
		<Tabs.TabList ref={ ref }>
			<Tabs.Tab tabId="media" data-tab-id="media">
				{ __( 'Media' ) }
			</Tabs.Tab>
		</Tabs.TabList>
	);
} );

function SidebarContent( { postId }: SidebarProps ) {
	const tabsContextValue = useContext( Tabs.Context );

	const { media, isLoading } = useSelect(
		( select ) => {
			const editedMedia = select( coreStore ).getEditedEntityRecord(
				'postType',
				'attachment',
				postId
			);
			return {
				media: editedMedia as Media,
				isLoading: ! editedMedia,
			};
		},
		[ postId ]
	);

	const { editEntityRecord } = useDispatch( coreStore );

	const handleUpdate = ( updates: Partial< Media > ) => {
		editEntityRecord( 'postType', 'attachment', postId, updates );
	};

	return (
		<ComplementaryArea
			scope="core/media-editor"
			identifier="media-editor-sidebar"
			header={
				<Tabs.Context.Provider value={ tabsContextValue }>
					<SidebarHeader />
				</Tabs.Context.Provider>
			}
			headerClassName="media-editor-sidebar__header"
			className="media-editor-sidebar"
			title={ __( 'Media Editor' ) }
			closeLabel={ __( 'Close panel' ) }
			icon={ cog }
			isPinnable={ false }
			isActiveByDefault={ SIDEBAR_ACTIVE_BY_DEFAULT }
		>
			<div className="media-editor-sidebar__content">
				<Tabs.Context.Provider value={ tabsContextValue }>
					<Tabs.TabPanel tabId="media" focusable={ false }>
						<PostCardPanel
							postType="attachment"
							postId={ postId }
						/>
						<MediaEditorProvider
							media={ media }
							fields={ MEDIA_FIELDS }
							onUpdate={ handleUpdate }
							isLoading={ isLoading }
						>
							<MediaForm />
						</MediaEditorProvider>
					</Tabs.TabPanel>
				</Tabs.Context.Provider>
			</div>
		</ComplementaryArea>
	);
}

export default function Sidebar( { postId }: SidebarProps ) {
	const [ selectedTab, setSelectedTab ] = useState( 'media' );
	const { enableComplementaryArea } = useDispatch( interfaceStore );

	const onTabSelect = useCallback(
		( newSelectedTabId: string ) => {
			if ( newSelectedTabId ) {
				enableComplementaryArea(
					'core/media-editor',
					'media-editor-sidebar'
				);
				setSelectedTab( newSelectedTabId );
			}
		},
		[ enableComplementaryArea ]
	);

	return (
		<Tabs selectedTabId={ selectedTab } onSelect={ onTabSelect }>
			<SidebarContent postId={ postId } />
		</Tabs>
	);
}
