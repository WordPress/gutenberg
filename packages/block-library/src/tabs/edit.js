/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	InnerBlocks,
	withColors,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { TabFill } from '../tab/slotfill';
import StyleEngine from './style-engine';
import Controls from './controls';

const TABS_TEMPLATE = [
	[ 'core/tab', { label: 'Tab 1', anchor: 'tab-1' } ],
	[ 'core/tab', { label: 'Tab 2', anchor: 'tab-2' } ],
];

const DEFAULT_BLOCK = {
	name: 'core/tab',
	attributesToCopy: [ 'className', 'fontFamily', 'fontSize' ],
};

function Edit( {
	clientId,
	attributes,
	setAttributes,
	tabInactiveColor,
	setTabInactiveColor,
	tabHoverColor,
	setTabHoverColor,
	tabActiveColor,
	setTabActiveColor,
	tabTextColor,
	setTabTextColor,
	tabActiveTextColor,
	setTabActiveTextColor,
	tabHoverTextColor,
	setTabHoverTextColor,
} ) {
	const { style, orientation } = attributes;

	/**
	 * Block props for the tabs container.
	 */
	const blockProps = useBlockProps( {
		className: clsx(
			'vertical' === orientation ? 'is-vertical' : 'is-horizontal'
		),
		style: {
			...style,
		},
	} );

	/**
	 * Innerblocks props for the tabs list.
	 */
	const innerBlockProps = useInnerBlocksProps( blockProps, {
		defaultBlock: DEFAULT_BLOCK,
		directInsert: true,
		__experimentalCaptureToolbars: true,
		clientId,
		orientation,
		template: TABS_TEMPLATE,
		renderAppender: false, // We handle this via a slotfill.
	} );

	return (
		<>
			<div { ...innerBlockProps }>
				{ innerBlockProps.children }
				<TabFill tabsClientId={ clientId }>
					<div className="wp-block-tabs__tab-item__inserter">
						<InnerBlocks.ButtonBlockAppender />
					</div>
				</TabFill>
				<StyleEngine attributes={ attributes } clientId={ clientId } />
				<Controls
					{ ...{
						clientId,
						attributes,
						setAttributes,
						tabInactiveColor,
						setTabInactiveColor,
						tabHoverColor,
						setTabHoverColor,
						tabActiveColor,
						setTabActiveColor,
						tabTextColor,
						setTabTextColor,
						tabActiveTextColor,
						setTabActiveTextColor,
						tabHoverTextColor,
						setTabHoverTextColor,
					} }
				/>
			</div>
		</>
	);
}

export default withColors(
	'tabInactiveColor',
	'tabHoverColor',
	'tabActiveColor',
	'tabTextColor',
	'tabActiveTextColor',
	'tabHoverTextColor'
)( Edit );
