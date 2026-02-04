/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

/**
 * The old attributes before restructuring.
 * Maintain during experimental phase to allow for migration.
 *
 * TODO: Should be removed after the experimental phase before release into main block library.
 */
const v1Attributes = {
	tabsId: {
		type: 'string',
		default: '',
	},
	orientation: {
		type: 'string',
		default: 'horizontal',
		enum: [ 'horizontal', 'vertical' ],
	},
	activeTabIndex: {
		type: 'number',
		default: 0,
	},
	tabInactiveColor: {
		type: 'string',
	},
	customTabInactiveColor: {
		type: 'string',
	},
	tabHoverColor: {
		type: 'string',
	},
	customTabHoverColor: {
		type: 'string',
	},
	tabActiveColor: {
		type: 'string',
	},
	customTabActiveColor: {
		type: 'string',
	},
	tabTextColor: {
		type: 'string',
	},
	customTabTextColor: {
		type: 'string',
	},
	tabActiveTextColor: {
		type: 'string',
	},
	customTabActiveTextColor: {
		type: 'string',
	},
	tabHoverTextColor: {
		type: 'string',
	},
	customTabHoverTextColor: {
		type: 'string',
	},
};

/**
 * The old save function before restructuring.
 * This renders the tab blocks directly as children with a tabs list placeholder.
 *
 * @param {Object} root0            Component props.
 * @param {Object} root0.attributes Block attributes.
 */
function v1Save( { attributes } ) {
	const blockProps = useBlockProps.save();
	const innerBlocksProps = useInnerBlocksProps.save( {} );
	const title = attributes?.metadata?.name || 'Tab Contents';

	return (
		<div { ...blockProps }>
			<h3 className="tabs__title">{ title }</h3>
			<ul className="tabs__list"></ul>
			{ innerBlocksProps.children }
		</div>
	);
}

/**
 * Migration function to convert old tabs structure to new structure.
 *
 * Old structure:
 * - core/tabs (with color attributes and tab innerblocks)
 *   - core/tab
 *   - core/tab
 *
 * New structure:
 * - core/tabs (orientation only)
 *   - core/tabs-menu (with color attributes)
 *   - core/tab-panel
 *     - core/tab
 *     - core/tab
 *
 * @param {Object} attributes  Block attributes.
 * @param {Array}  innerBlocks Inner blocks array.
 */
function v1Migrate( attributes, innerBlocks ) {
	// Extract color attributes for tabs-menu
	const tabsMenuAttributes = {
		// Map inactive colors to core background/text supports
		backgroundColor: attributes.tabInactiveColor,
		textColor: attributes.tabTextColor,
		// Map custom inactive colors
		style: {
			color: {
				background: attributes.customTabInactiveColor,
				text: attributes.customTabTextColor,
			},
		},
		// Active colors
		activeBackgroundColor: attributes.tabActiveColor,
		customActiveBackgroundColor: attributes.customTabActiveColor,
		activeTextColor: attributes.tabActiveTextColor,
		customActiveTextColor: attributes.customTabActiveTextColor,
		// Hover colors
		hoverBackgroundColor: attributes.tabHoverColor,
		customHoverBackgroundColor: attributes.customTabHoverColor,
		hoverTextColor: attributes.tabHoverTextColor,
		customHoverTextColor: attributes.customTabHoverTextColor,
	};

	// Clean up undefined values from style object
	if ( tabsMenuAttributes.style?.color ) {
		if ( ! tabsMenuAttributes.style.color.background ) {
			delete tabsMenuAttributes.style.color.background;
		}
		if ( ! tabsMenuAttributes.style.color.text ) {
			delete tabsMenuAttributes.style.color.text;
		}
		if ( Object.keys( tabsMenuAttributes.style.color ).length === 0 ) {
			delete tabsMenuAttributes.style.color;
		}
		if ( Object.keys( tabsMenuAttributes.style ).length === 0 ) {
			delete tabsMenuAttributes.style;
		}
	}

	// Clean up undefined top-level attributes
	Object.keys( tabsMenuAttributes ).forEach( ( key ) => {
		if ( tabsMenuAttributes[ key ] === undefined ) {
			delete tabsMenuAttributes[ key ];
		}
	} );

	// Create tabs-menu block
	const tabsMenuBlock = createBlock( 'core/tabs-menu', tabsMenuAttributes );

	// Create tab-panel block with existing tab innerblocks
	const tabPanelBlock = createBlock( 'core/tab-panel', {}, innerBlocks );

	// Return new attributes (stripped of color attrs) and new innerblocks structure
	const newAttributes = {
		tabsId: attributes.tabsId,
		orientation: attributes.orientation,
		activeTabIndex: attributes.activeTabIndex,
		metadata: attributes.metadata,
	};

	return [ newAttributes, [ tabsMenuBlock, tabPanelBlock ] ];
}

/**
 * Check if block is using old structure (tab blocks directly as children).
 *
 * @param {Object} attributes  Block attributes.
 * @param {Array}  innerBlocks Inner blocks array.
 */
function v1IsEligible( attributes, innerBlocks ) {
	// If there are any direct tab children (not wrapped in tab-panel), this is old structure
	return innerBlocks.some( ( block ) => block.name === 'core/tab' );
}

const deprecated = [
	{
		attributes: v1Attributes,
		supports: {
			align: true,
			color: {
				text: false,
				background: false,
			},
			html: false,
			interactivity: true,
			spacing: {
				blockGap: [ 'horizontal', 'vertical' ],
				margin: true,
				padding: false,
			},
			typography: {
				fontSize: true,
				__experimentalFontFamily: true,
			},
			__experimentalBorder: {
				radius: true,
				__experimentalSkipSerialization: true,
				__experimentalDefaultControls: {
					radius: true,
				},
			},
		},
		isEligible: v1IsEligible,
		migrate: v1Migrate,
		save: v1Save,
	},
];

export default deprecated;
