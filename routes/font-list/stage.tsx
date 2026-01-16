/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { FontLibrary } from '@wordpress/global-styles-ui';
import type { FontCollection as FontCollectionType } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
import './style.scss';

const { Tabs } = unlock( componentsPrivateApis );
const { useGlobalStyles } = unlock( editorPrivateApis );

function FontLibraryPage() {
	const { records: collections = [] } =
		useEntityRecords< FontCollectionType >( 'root', 'fontCollection', {
			_fields: 'slug,name,description',
		} );
	const [ activeTab, setActiveTab ] = useState( 'installed-fonts' );

	// Use the useGlobalStyles hook from @wordpress/editor
	const { base, user, setUser, isReady } = useGlobalStyles();

	// Check user permissions
	const canUserCreate = useSelect( ( select ) => {
		return select( coreStore ).canUser( 'create', {
			kind: 'postType',
			name: 'wp_font_family',
		} );
	}, [] );

	// Wait for global styles to load
	if ( ! isReady ) {
		return null;
	}

	// Build tabs array
	const tabs: {
		id: string;
		title: string;
	}[] = [
		{
			id: 'installed-fonts',
			title: __( 'Library' ),
		},
	];

	if ( canUserCreate ) {
		tabs.push( {
			id: 'upload-fonts',
			title: __( 'Upload' ),
		} );
		tabs.push(
			...( collections || [] ).map( ( { slug, name } ) => ( {
				id: slug,
				title:
					collections &&
					collections.length === 1 &&
					slug === 'google-fonts'
						? __( 'Install Fonts' )
						: name,
			} ) )
		);
	}

	return (
		<Page title={ __( 'Fonts' ) }>
			<Tabs
				selectedTabId={ activeTab }
				onSelect={ ( tabId: string ) => setActiveTab( tabId ) }
			>
				<div className="font-library-page__tablist">
					<Tabs.TabList>
						{ tabs.map( ( { id, title } ) => (
							<Tabs.Tab key={ id } tabId={ id }>
								{ title }
							</Tabs.Tab>
						) ) }
					</Tabs.TabList>
				</div>
				{ tabs.map( ( { id } ) => (
					<Tabs.TabPanel
						key={ id }
						tabId={ id }
						focusable={ false }
						className="font-library-page__tab-panel"
					>
						<FontLibrary
							value={ user }
							baseValue={ base }
							onChange={ setUser }
							activeTab={ id }
						/>
					</Tabs.TabPanel>
				) ) }
			</Tabs>
		</Page>
	);
}

function Stage() {
	return <FontLibraryPage />;
}

export const stage = Stage;
