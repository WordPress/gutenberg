/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { forwardRef, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { getBlockType, withBlockContentContext } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import ButtonBlockAppender from './button-block-appender';
import DefaultBlockAppender from './default-block-appender';
import useNestedSettingsUpdate from './use-nested-settings-update';
import useInnerBlockTemplateSync from './use-inner-block-template-sync';
import getBlockContext from './get-block-context';

/**
 * Internal dependencies
 */
import BlockList from '../block-list';
import { BlockContextProvider } from '../block-context';
import { useBlockEditContext } from '../block-edit/context';
import useBlockSync from '../provider/use-block-sync';

const ForwardedInnerBlocks = forwardRef( ( props, ref ) => {
	const { clientId } = useBlockEditContext();
	const fallbackRef = useRef();
	const forwardedRef = ref || fallbackRef;

	// This hook keeps the innerBlocks of the block in the block-editor store in
	// sync with the blocks of the controlling entity. An example of an inner
	// block controller is a template part block, which provides its own blocks
	// from the template part entity data source.
	useBlockSync( props );

	const {
		allowedBlocks,
		template,
		templateLock,
		templateInsertUpdatesSelection,
		__experimentalCaptureToolbars: captureToolbars,
		orientation,
	} = props;

	const isSmallScreen = useViewportMatch( 'medium', '<' );
	const { hasOverlay, block, enableClickThrough } = useSelect( ( select ) => {
		const {
			getBlock,
			isBlockSelected,
			hasSelectedInnerBlock,
			isNavigationMode,
		} = select( 'core/block-editor' );
		const theBlock = getBlock( clientId );
		return {
			block: theBlock,
			hasOverlay:
				theBlock.name !== 'core/template' &&
				! isBlockSelected( clientId ) &&
				! hasSelectedInnerBlock( clientId, true ),
			enableClickThrough: isNavigationMode() || isSmallScreen,
		};
	} );

	useNestedSettingsUpdate(
		clientId,
		allowedBlocks,
		templateLock,
		captureToolbars,
		orientation
	);

	useInnerBlockTemplateSync(
		clientId,
		template,
		templateLock,
		templateInsertUpdatesSelection
	);

	const classes = classnames( {
		'has-overlay': enableClickThrough && hasOverlay,
		'is-capturing-toolbar': captureToolbars,
	} );

	let blockList = (
		<BlockList
			{ ...props }
			ref={ forwardedRef }
			rootClientId={ clientId }
			className={ classes }
		/>
	);

	// Wrap context provider if (and only if) block has context to provide.
	const blockType = getBlockType( block.name );
	if ( blockType && blockType.providesContext ) {
		const context = getBlockContext( block.attributes, blockType );

		blockList = (
			<BlockContextProvider value={ context }>
				{ blockList }
			</BlockContextProvider>
		);
	}

	if ( props.__experimentalTagName ) {
		return blockList;
	}

	return <div className="block-editor-inner-blocks">{ blockList }</div>;
} );

// Expose default appender placeholders as components.
ForwardedInnerBlocks.DefaultBlockAppender = DefaultBlockAppender;
ForwardedInnerBlocks.ButtonBlockAppender = ButtonBlockAppender;

ForwardedInnerBlocks.Content = withBlockContentContext(
	( { BlockContent } ) => <BlockContent />
);

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/inner-blocks/README.md
 */
export default ForwardedInnerBlocks;
