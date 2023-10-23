/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	InnerBlocks,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';

const NavigationOverlayEdit = ( {
	attributes,
	clientId,
	__unstableLayoutClassNames: layoutClassNames,
} ) => {
	const { hasInnerBlocks, themeSupportsLayout } = useSelect(
		( select ) => {
			const { getBlock, getSettings } = select( blockEditorStore );
			const block = getBlock( clientId );
			return {
				hasInnerBlocks: !! ( block && block.innerBlocks.length ),
				themeSupportsLayout: getSettings()?.supportsLayout,
			};
		},
		[ clientId ]
	);

	const { templateLock, allowedBlocks, layout = {} } = attributes;

	// Layout settings.
	const { type = 'default' } = layout;
	const layoutSupportEnabled =
		themeSupportsLayout || type === 'flex' || type === 'grid';

	// Hooks.
	const blockProps = useBlockProps( {
		className: ! layoutSupportEnabled ? layoutClassNames : null,
	} );

	// Default to the regular appender being rendered.
	let renderAppender;
	if ( ! hasInnerBlocks ) {
		// When there is no placeholder, but the block is also empty,
		// use the larger button appender.
		renderAppender = InnerBlocks.ButtonBlockAppender;
	}

	const innerBlocksProps = useInnerBlocksProps(
		layoutSupportEnabled
			? blockProps
			: { className: 'wp-block-navigation-overlay' },
		{
			templateLock,
			allowedBlocks,
			renderAppender,
			__unstableDisableLayoutClassNames: ! layoutSupportEnabled,
		}
	);

	return <div { ...innerBlocksProps } />;
};

export default NavigationOverlayEdit;
