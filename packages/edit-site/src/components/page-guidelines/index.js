/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useState, useCallback, useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { Button } from '@wordpress/components';
import { backup } from '@wordpress/icons';
import { HistoryPanel } from '@wordpress/content-guidelines';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import GuidelinesLibrary from './guidelines-library';
import GuidelinesBlocks from './guidelines-blocks';
import GuidelinesPlayground from './guidelines-playground';
import GuidelinesImportExport from './guidelines-import-export';

const { useLocation, useHistory } = unlock( routerPrivateApis );

// Section definitions
const SECTIONS = {
	library: {
		title: __( 'Library' ),
		description: __( "Define your site's voice, tone, and copy rules." ),
		Component: GuidelinesLibrary,
	},
	blocks: {
		title: __( 'Blocks' ),
		description: __( 'Set guidelines for specific block types.' ),
		Component: GuidelinesBlocks,
	},
	playground: {
		title: __( 'Playground' ),
		description: __( 'Test your guidelines against real content.' ),
		Component: GuidelinesPlayground,
	},
	'import-export': {
		title: __( 'Import / Export' ),
		description: __( 'Import or export your guidelines as JSON.' ),
		Component: GuidelinesImportExport,
	},
};

const DEFAULT_SECTION = 'library';

function HeaderActions( { onShowHistory } ) {
	return (
		<Button
			icon={ backup }
			label={ __( 'History' ) }
			onClick={ onShowHistory }
		/>
	);
}

export default function PageGuidelines() {
	const [ showHistory, setShowHistory ] = useState( false );
	const { path, query } = useLocation();
	const history = useHistory();

	// Current navigation state from URL
	const currentSection = query.section || DEFAULT_SECTION;
	const currentSubsection = query.subsection || null;
	const currentBlock = query.block || null;

	const sectionConfig =
		SECTIONS[ currentSection ] || SECTIONS[ DEFAULT_SECTION ];
	const { title, description, Component } = sectionConfig;

	/**
	 * Navigate to a new location within guidelines.
	 * This updates the URL and triggers a re-render with the new state.
	 *
	 * @param {Object} params            Navigation parameters.
	 * @param {string} params.section    Main section (library, blocks, playground, import-export).
	 * @param {string} params.subsection Subsection within the section (e.g., brand_context).
	 * @param {string} params.block      Block name for blocks section (e.g., core/paragraph).
	 */
	const navigateTo = useCallback(
		( params ) => {
			const newQuery = { ...query };

			// Update section if provided
			if ( params.section !== undefined ) {
				if ( params.section ) {
					newQuery.section = params.section;
				} else {
					delete newQuery.section;
				}
				// Clear subsection and block when changing section
				delete newQuery.subsection;
				delete newQuery.block;
			}

			// Update subsection if provided
			if ( params.subsection !== undefined ) {
				if ( params.subsection ) {
					newQuery.subsection = params.subsection;
				} else {
					delete newQuery.subsection;
				}
			}

			// Update block if provided
			if ( params.block !== undefined ) {
				if ( params.block ) {
					newQuery.block = params.block;
				} else {
					delete newQuery.block;
				}
			}

			history.navigate( addQueryArgs( path, newQuery ) );
		},
		[ history, path, query ]
	);

	// Handlers for child component navigation
	const handleSubsectionChange = useCallback(
		( subsection ) => {
			navigateTo( { subsection } );
		},
		[ navigateTo ]
	);

	const handleBlockChange = useCallback(
		( block ) => {
			navigateTo( { block } );
		},
		[ navigateTo ]
	);

	// Create navigation context for child components
	const navigationProps = useMemo(
		() => ( {
			// For LibraryPanel
			initialSubsection: currentSubsection,
			onSubsectionChange: handleSubsectionChange,
			// For BlocksPanel
			initialBlock: currentBlock,
			onBlockChange: handleBlockChange,
			// Generic navigation
			navigateTo,
		} ),
		[
			currentSubsection,
			currentBlock,
			handleSubsectionChange,
			handleBlockChange,
			navigateTo,
		]
	);

	return (
		<>
			<Page
				className="edit-site-page-guidelines"
				title={ title }
				subTitle={ description }
				actions={
					<HeaderActions
						onShowHistory={ () => setShowHistory( true ) }
					/>
				}
			>
				<Component { ...navigationProps } />
			</Page>
			{ showHistory && (
				<HistoryPanel onClose={ () => setShowHistory( false ) } />
			) }
		</>
	);
}
