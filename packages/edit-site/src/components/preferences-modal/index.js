/**
 * WordPress dependencies
 */
import {
	PreferencesModal,
	PreferencesModalTabs,
	PreferencesModalSection,
	store as interfaceStore,
} from '@wordpress/interface';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import EnableFeature from './enable-feature';
import { store as editSiteStore } from '../../store';

export const PREFERENCES_MODAL_NAME = 'edit-site/preferences';

export default function EditSitePreferencesModal() {
	const isModalActive = useSelect( ( select ) =>
		select( interfaceStore ).isModalActive( PREFERENCES_MODAL_NAME )
	);
	const { closeModal, openModal } = useDispatch( interfaceStore );
	const toggleModal = () =>
		isModalActive ? closeModal() : openModal( PREFERENCES_MODAL_NAME );
	const registry = useRegistry();
	const { closeGeneralSidebar } = useDispatch( editSiteStore );
	const { setIsListViewOpened, setIsInserterOpened } =
		useDispatch( editorStore );

	const { set: setPreference } = useDispatch( preferencesStore );
	const toggleDistractionFree = () => {
		registry.batch( () => {
			setPreference( 'core/edit-site', 'fixedToolbar', true );
			setIsInserterOpened( false );
			setIsListViewOpened( false );
			closeGeneralSidebar();
		} );
	};

	const turnOffDistractionFree = () => {
		setPreference( 'core/edit-site', 'distractionFree', false );
	};

	const sections = useMemo( () => [
		{
			name: 'general',
			tabLabel: __( 'General' ),
			content: (
				<PreferencesModalSection title={ __( 'Interface' ) }>
					<EnableFeature
						scope="core"
						featureName="showListViewByDefault"
						help={ __(
							'Opens the block list view sidebar by default.'
						) }
						label={ __( 'Always open list view' ) }
					/>
					<EnableFeature
						scope="core"
						featureName="showBlockBreadcrumbs"
						help={ __(
							'Shows block breadcrumbs at the bottom of the editor.'
						) }
						label={ __( 'Display block breadcrumbs' ) }
					/>
					<EnableFeature
						scope="core"
						featureName="allowRightClickOverrides"
						help={ __(
							'Allows contextual list view menus via right-click, overriding browser defaults.'
						) }
						label={ __( 'Allow right-click contextual menus' ) }
					/>
				</PreferencesModalSection>
			),
		},
		{
			name: 'appearance',
			tabLabel: __( 'Appearance' ),
			content: (
				<PreferencesModalSection
					title={ __( 'Appearance' ) }
					description={ __(
						'Customize the editor interface to suit your needs.'
					) }
				>
					<EnableFeature
						featureName="fixedToolbar"
						onToggle={ turnOffDistractionFree }
						help={ __(
							'Access all block and document tools in a single place.'
						) }
						label={ __( 'Top toolbar' ) }
					/>
					<EnableFeature
						featureName="distractionFree"
						onToggle={ toggleDistractionFree }
						help={ __(
							'Reduce visual distractions by hiding the toolbar and other elements to focus on writing.'
						) }
						label={ __( 'Distraction free' ) }
					/>
					<EnableFeature
						scope="core"
						featureName="focusMode"
						help={ __(
							'Highlights the current block and fades other content.'
						) }
						label={ __( 'Spotlight mode' ) }
					/>
				</PreferencesModalSection>
			),
		},
		{
			name: 'accessibility',
			tabLabel: __( 'Accessibility' ),
			content: (
				<>
					<PreferencesModalSection
						title={ __( 'Navigation' ) }
						description={ __(
							'Optimize the editing experience for enhanced control.'
						) }
					>
						<EnableFeature
							scope="core"
							featureName="keepCaretInsideBlock"
							help={ __(
								'Keeps the text cursor within the block boundaries, aiding users with screen readers by preventing unintentional cursor movement outside the block.'
							) }
							label={ __( 'Contain text cursor inside block' ) }
						/>
					</PreferencesModalSection>
					<PreferencesModalSection title={ __( 'Interface' ) }>
						<EnableFeature
							scope="core"
							featureName="showIconLabels"
							label={ __( 'Show button text labels' ) }
							help={ __(
								'Show text instead of icons on buttons across the interface.'
							) }
						/>
					</PreferencesModalSection>
				</>
			),
		},
	] );
	if ( ! isModalActive ) {
		return null;
	}
	return (
		<PreferencesModal closeModal={ toggleModal }>
			<PreferencesModalTabs sections={ sections } />
		</PreferencesModal>
	);
}
