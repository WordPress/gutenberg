import {
	__experimentalUseSlotFills as useSlotFills,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
import InspectorControlsGroups from '../inspector-controls/groups';
import { InspectorAdvancedControls } from '../inspector-controls';
import { TAB_LIST_VIEW, TAB_SETTINGS, TAB_STYLES, TAB_CONTENT } from './utils';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { useSlotFillsForNames } = unlock( componentsPrivateApis );

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

function getShowTabs( blockName, tabSettings = {} ) {
	// Block specific setting takes precedence over generic default.
	if ( tabSettings[ blockName ] !== undefined ) {
		return tabSettings[ blockName ];
	}

	// Use generic default if set over the Gutenberg experiment option.
	if ( tabSettings.default !== undefined ) {
		return tabSettings.default;
	}

	return true;
}

export default function useInspectorControlsTabs(
	blockName,
	contentClientIds,
	isSectionBlock,
	hasBlockStyles
) {
	const tabs = [];
	const {
		bindings: bindingsGroup,
		border: borderGroup,
		color: colorGroup,
		content: contentGroup,
		default: defaultGroup,
		layout: layoutGroup,
		dimensions: dimensionsGroup,
		list: listGroup,
		position: positionGroup,
		styles: stylesGroup,
		typography: typographyGroup,
		effects: effectsGroup,
	} = InspectorControlsGroups;

	// List View Tab: If there are any fills for the list group add that tab.
	const listFills = useSlotFills( listGroup.name );
	const hasListFills = !! listFills && listFills.length;

	// Content Tab: If there are any fills for the content group add that tab.
	const contentFills = useSlotFills( contentGroup.name );
	const hasContentFills = !! contentFills && contentFills.length;

	// Styles Tab: Add this tab if there are any fills for block supports
	// e.g. border, color, spacing, typography, etc.
	const styleFills = [
		...( useSlotFills( borderGroup.name ) || [] ),
		...( useSlotFills( colorGroup.name ) || [] ),
		...( useSlotFills( layoutGroup.name ) || [] ),
		...( useSlotFills( positionGroup.name ) || [] ),
		...( useSlotFills( dimensionsGroup.name ) || [] ),
		...( useSlotFills( stylesGroup.name ) || [] ),
		...( useSlotFills( typographyGroup.name ) || [] ),
		...( useSlotFills( effectsGroup.name ) || [] ),
	];
	const hasStyleFills = styleFills.length;

	// Settings Tab: If we don't have multiple tabs to display
	// (i.e. both list view and styles), check only the default
	// InspectorControls slots. If we have multiple tabs, we'll need to check
	// the advanced controls slot as well to ensure they are rendered.
	const advancedFills = [
		...( useSlotFills( InspectorAdvancedControls.slotName ) || [] ),
		...( useSlotFills( bindingsGroup.name ) || [] ),
	];

	const settingsFills = [
		...( useSlotFills( defaultGroup.name ) || [] ),
		...( hasListFills && hasStyleFills > 1 ? advancedFills : [] ),
	];

	const hasContentTab = hasContentFills || contentClientIds?.length;

	if ( hasContentTab ) {
		tabs.push( TAB_CONTENT );
	}

	// Add the tabs in the order that they will default to if available.
	// List View > Content > Settings > Styles.
	if ( hasListFills ) {
		tabs.push( TAB_LIST_VIEW );
	}

	if (
		settingsFills.length ||
		// Advanced fills show up in settings tab if available or they blend into the default tab, if there's only one tab.
		( advancedFills.length && ( hasContentTab || hasListFills ) )
	) {
		tabs.push( TAB_SETTINGS );
	}

	const { tabSettings, isPreviewMode } = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return {
			tabSettings: settings.blockInspectorTabs,
			isPreviewMode: settings.isPreviewMode,
		};
	}, [] );

	if ( ! isPreviewMode && ( hasBlockStyles || hasStyleFills ) ) {
		tabs.push( TAB_STYLES );
	}

	// Custom tabs registered via `registerInspectorTab()`. They're placed
	// after the built-in tabs, and — like those — only actually show up once
	// something fills their group for this block.
	const registeredTabs = useSelect(
		( select ) =>
			unlock( select( blockEditorStore ) ).getRegisteredInspectorTabs(),
		[]
	);

	const eligibleCustomTabs = useMemo( () => {
		return Object.entries( registeredTabs ?? EMPTY_OBJECT )
			.filter(
				( [ , tab ] ) =>
					! tab.blocks || tab.blocks.includes( blockName )
			)
			.sort(
				( [ , a ], [ , b ] ) => ( a.order ?? 0 ) - ( b.order ?? 0 )
			);
	}, [ registeredTabs, blockName ] );

	const eligibleCustomTabNames = useMemo(
		() => eligibleCustomTabs.map( ( [ name ] ) => name ),
		[ eligibleCustomTabs ]
	);

	const customTabNamesWithFills = useSlotFillsForNames(
		eligibleCustomTabNames
	);

	for ( const [ name, tab ] of eligibleCustomTabs ) {
		if ( customTabNamesWithFills.has( name ) ) {
			tabs.push( {
				name,
				value: name,
				title: tab.title,
				icon: tab.icon,
			} );
		}
	}

	// Lets a plugin add, remove or reorder tabs beyond what
	// `registerInspectorTab()` alone allows — e.g. hiding a tab for a block
	// it doesn't own, or reordering tabs relative to the built-in ones — the
	// same way PHP's block-related filters can adjust output another
	// component already produced. Runs on the fully assembled tab list, so a
	// filter sees (and can act on) core, custom and previously-filtered
	// entries alike.
	const filteredTabs = applyFilters(
		'editor.InspectorControlsTabs',
		tabs,
		blockName
	);

	const showTabs = getShowTabs( blockName, tabSettings );
	return showTabs ? filteredTabs : EMPTY_ARRAY;
}
