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
	withColors,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import StyleEngine from './style-engine';
import Controls from './controls';

const TABS_TEMPLATE = [ [ 'core/tab', {} ] ];

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
		renderAppender: false, // Appender is rendered by individual tab blocks.
	} );

	return (
		<>
			<div { ...innerBlockProps }>
				{ innerBlockProps.children }
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
