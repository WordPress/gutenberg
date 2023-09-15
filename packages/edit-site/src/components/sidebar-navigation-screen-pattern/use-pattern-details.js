/**
 * External dependencies
 */
import { sentenceCase } from 'change-case';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useAddedBy } from '../list/added-by';
import useEditedEntityRecord from '../use-edited-entity-record';
import useNavigationMenuContent from './use-navigation-menu-content';
import SidebarNavigationScreenDetailsFooter from '../sidebar-navigation-screen-details-footer';
import {
	SidebarNavigationScreenDetailsPanel,
	SidebarNavigationScreenDetailsPanelRow,
	SidebarNavigationScreenDetailsPanelLabel,
	SidebarNavigationScreenDetailsPanelValue,
} from '../sidebar-navigation-screen-details-panel';

export default function usePatternDetails( postType, postId ) {
	const { getDescription, getTitle, record } = useEditedEntityRecord(
		postType,
		postId
	);
	const templatePartAreas = useSelect(
		( select ) =>
			select( editorStore ).__experimentalGetDefaultTemplatePartAreas(),
		[]
	);
	const { currentTheme, patternCategories } = useSelect( ( select ) => {
		const { getCurrentTheme, getUserPatternCategories } =
			select( coreStore );

		return {
			currentTheme: getCurrentTheme(),
			patternCategories: getUserPatternCategories().patternCategoriesMap,
		};
	}, [] );

	const addedBy = useAddedBy( postType, postId );
	const isAddedByActiveTheme =
		addedBy.type === 'theme' && record.theme === currentTheme?.stylesheet;
	const title = getTitle();
	let description = getDescription();

	if ( ! description && addedBy.text ) {
		description =
			postType === 'wp_block'
				? sprintf(
						// translators: %s: pattern title e.g: "Header".
						__( 'This is the %s pattern.' ),
						getTitle()
				  )
				: sprintf(
						// translators: %s: template part title e.g: "Header".
						__( 'This is the %s template part.' ),
						getTitle()
				  );
	}

	if ( ! description && postType === 'wp_block' && record?.title ) {
		description = sprintf(
			// translators: %s: user created pattern title e.g. "Footer".
			__( 'This is the %s pattern.' ),
			record.title
		);
	}

	const footer = record?.modified ? (
		<SidebarNavigationScreenDetailsFooter record={ record } />
	) : null;

	const details = [];

	if ( postType === 'wp_block' || 'wp_template_part' ) {
		details.push( {
			label: __( 'Syncing' ),
			value:
				record.wp_pattern_sync_status === 'unsynced'
					? __( 'Not synced' )
					: __( 'Fully synced' ),
		} );

		if ( record.wp_pattern_category?.length === 0 ) {
			details.push( {
				label: __( 'Categories' ),
				value: __( 'Uncategorized' ),
			} );
		}
		if ( record.wp_pattern_category?.length > 0 ) {
			const categories = record.wp_pattern_category
				.filter( ( category ) => patternCategories.get( category ) )
				.map( ( category ) => patternCategories.get( category ).label );

			details.push( {
				label: __( 'Categories' ),
				value: categories.length > 0 ? categories.join( ', ' ) : '',
			} );
		}
	}

	if ( postType === 'wp_template_part' ) {
		const templatePartArea = templatePartAreas.find(
			( area ) => area.area === record.area
		);

		let areaDetailValue = templatePartArea?.label;

		if ( ! areaDetailValue ) {
			areaDetailValue = record.area
				? sprintf(
						// translators: %s: Sentenced cased template part area e.g: "My custom area".
						__( '%s (removed)' ),
						sentenceCase( record.area )
				  )
				: __( 'None' );
		}

		details.push( { label: __( 'Area' ), value: areaDetailValue } );
	}

	if (
		postType === 'wp_template_part' &&
		addedBy.text &&
		! isAddedByActiveTheme
	) {
		details.push( {
			label: __( 'Added by' ),
			value: (
				<span className="edit-site-sidebar-navigation-screen-pattern__added-by-description-author">
					{ addedBy.text }
				</span>
			),
		} );
	}

	if (
		postType === 'wp_template_part' &&
		addedBy.text &&
		( record.origin === 'plugin' || record.has_theme_file === true )
	) {
		details.push( {
			label: __( 'Customized' ),
			value: (
				<span className="edit-site-sidebar-navigation-screen-pattern__added-by-description-customized">
					{ addedBy.isCustomized ? __( 'Yes' ) : __( 'No' ) }
				</span>
			),
		} );
	}

	const content = (
		<>
			{ useNavigationMenuContent( postType, postId ) }
			{ !! details.length && (
				<SidebarNavigationScreenDetailsPanel
					spacing={ 5 }
					title={ __( 'Details' ) }
				>
					{ details.map( ( { label, value } ) => (
						<SidebarNavigationScreenDetailsPanelRow key={ label }>
							<SidebarNavigationScreenDetailsPanelLabel>
								{ label }
							</SidebarNavigationScreenDetailsPanelLabel>
							<SidebarNavigationScreenDetailsPanelValue>
								{ value }
							</SidebarNavigationScreenDetailsPanelValue>
						</SidebarNavigationScreenDetailsPanelRow>
					) ) }
				</SidebarNavigationScreenDetailsPanel>
			) }
		</>
	);

	return { title, description, content, footer };
}
