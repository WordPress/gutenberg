/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useViewportMatch, useMergeRefs } from '@wordpress/compose';
import { forwardRef } from '@wordpress/element';
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
import { BlockListItems } from '../block-list';
import { BlockContextProvider } from '../block-context';
import { useBlockEditContext } from '../block-edit/context';
import useBlockSync from '../provider/use-block-sync';
import { store as blockEditorStore } from '../../store';
import useBlockDropZone from '../use-block-drop-zone';
import { useInBetweenClickRedirect } from '../block-list/use-in-between-click-redirect';

/**
 * InnerBlocks is a component which allows a single block to have multiple blocks
 * as children. The UncontrolledInnerBlocks component is used whenever the inner
 * blocks are not controlled by another entity. In other words, it is normally
 * used for inner blocks in the post editor
 *
 * @param {Object} props The component props.
 */
function UncontrolledInnerBlocks( props ) {
	const {
		clientId,
		allowedBlocks,
		template,
		templateLock,
		wrapperRef,
		templateInsertUpdatesSelection,
		__experimentalCaptureToolbars: captureToolbars,
		__experimentalAppenderTagName,
		renderAppender,
		orientation,
		placeholder,
		__experimentalLayout,
	} = props;

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

	const context = useSelect(
		( select ) => {
			const block = select( blockEditorStore ).getBlock( clientId );
			const blockType = getBlockType( block.name );

			if ( ! blockType || ! blockType.providesContext ) {
				return;
			}

			return getBlockContext( block.attributes, blockType );
		},
		[ clientId ]
	);

	// This component needs to always be synchronous as it's the one changing
	// the async mode depending on the block selection.
	return (
		<BlockContextProvider value={ context }>
			<BlockListItems
				rootClientId={ clientId }
				renderAppender={ renderAppender }
				__experimentalAppenderTagName={ __experimentalAppenderTagName }
				__experimentalLayout={ __experimentalLayout }
				wrapperRef={ wrapperRef }
				placeholder={ placeholder }
			/>
		</BlockContextProvider>
	);
}

/**
 * The controlled inner blocks component wraps the uncontrolled inner blocks
 * component with the blockSync hook. This keeps the innerBlocks of the block in
 * the block-editor store in sync with the blocks of the controlling entity. An
 * example of an inner block controller is a template part block, which provides
 * its own blocks from the template part entity data source.
 *
 * @param {Object} props The component props.
 */
function ControlledInnerBlocks( props ) {
	useBlockSync( props );
	return <UncontrolledInnerBlocks { ...props } />;
}

const ForwardedInnerBlocks = forwardRef( ( props, ref ) => {
	const innerBlocksProps = useInnerBlocksProps( { ref }, props );
	return (
		<div className="block-editor-inner-blocks">
			<div { ...innerBlocksProps } />
		</div>
	);
} );

/**
 * This hook is used to lightly mark an element as an inner blocks wrapper
 * element. Call this hook and pass the returned props to the element to mark as
 * an inner blocks wrapper, automatically rendering inner blocks as children. If
 * you define a ref for the element, it is important to pass the ref to this
 * hook, which the hook in turn will pass to the component through the props it
 * returns. Optionally, you can also pass any other props through this hook, and
 * they will be merged and returned.
 *
 * @param {Object} props   Optional. Props to pass to the element. Must contain
 *                         the ref if one is defined.
 * @param {Object} options Optional. Inner blocks options.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inner-blocks/README.md
 */
export function useInnerBlocksProps( props = {}, options = {} ) {
	const { clientId } = useBlockEditContext();
	const isSmallScreen = useViewportMatch( 'medium', '<' );
	const hasOverlay = useSelect(
		( select ) => {
			const {
				getBlockName,
				isBlockSelected,
				hasSelectedInnerBlock,
				isNavigationMode,
			} = select( blockEditorStore );
			const enableClickThrough = isNavigationMode() || isSmallScreen;
			return (
				getBlockName( clientId ) !== 'core/template' &&
				! isBlockSelected( clientId ) &&
				! hasSelectedInnerBlock( clientId, true ) &&
				enableClickThrough
			);
		},
		[ clientId, isSmallScreen ]
	);

	const ref = useMergeRefs( [
		props.ref,
		useInBetweenClickRedirect(),
		useBlockDropZone( {
			rootClientId: clientId,
		} ),
	] );
	const InnerBlocks =
		options.value && options.onChange
			? ControlledInnerBlocks
			: UncontrolledInnerBlocks;

	return {
		...props,
		ref,
		className: classnames(
			props.className,
			'block-editor-block-list__layout',
			{
				'has-overlay': hasOverlay,
			}
		),
		children: <InnerBlocks { ...options } clientId={ clientId } />,
	};
}

// Expose default appender placeholders as components.
ForwardedInnerBlocks.DefaultBlockAppender = DefaultBlockAppender;
ForwardedInnerBlocks.ButtonBlockAppender = ButtonBlockAppender;

ForwardedInnerBlocks.Content = withBlockContentContext(
	( { BlockContent } ) => <BlockContent />
);

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inner-blocks/README.md
 */
export default ForwardedInnerBlocks;
