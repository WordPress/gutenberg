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
import { BlockListItems } from '../block-list';
import { BlockContextProvider } from '../block-context';
import { useBlockEditContext } from '../block-edit/context';
import useBlockSync from '../provider/use-block-sync';

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

	const blockListItems = (
		<BlockListItems
			rootClientId={ clientId }
			renderAppender={ renderAppender }
			__experimentalAppenderTagName={ __experimentalAppenderTagName }
			wrapperRef={ wrapperRef }
		/>
	);

	const context = useSelect(
		( select ) => {
			const block = select( 'core/block-editor' ).getBlock( clientId );
			const blockType = getBlockType( block.name );

			if ( ! blockType || ! blockType.providesContext ) {
				return;
			}

			return getBlockContext( block.attributes, blockType );
		},
		[ clientId ]
	);

	return (
		<BlockContextProvider value={ context }>
			{ blockListItems }
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
	const fallbackRef = useRef();
	const { clientId } = useBlockEditContext();
	const isSmallScreen = useViewportMatch( 'medium', '<' );
	const hasOverlay = useSelect(
		( select ) => {
			const {
				getBlockName,
				isBlockSelected,
				hasSelectedInnerBlock,
				isNavigationMode,
			} = select( 'core/block-editor' );
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

	const {
		allowedBlocks,
		template,
		templateLock,
		templateInsertUpdatesSelection,
		__experimentalCaptureToolbars: captureToolbars,
		__experimentalAppenderTagName,
		renderAppender,
		orientation,
		__experimentalTagName: TagName = 'div',
		__experimentalPassedProps = {},
		value,
		onChange,
		...remainingProps
	} = props;

	const wrapperRef = __experimentalPassedProps.ref || ref || fallbackRef;
	const InnerBlocks =
		value && onChange ? ControlledInnerBlocks : UncontrolledInnerBlocks;

	const innerBlocksProps = {
		...__experimentalPassedProps,
		...remainingProps,
		ref: wrapperRef,
		className: classnames(
			__experimentalPassedProps.className,
			remainingProps.className,
			'block-editor-block-list__layout',
			{
				'has-overlay': hasOverlay,
			}
		),
	};

	const options = {
		allowedBlocks,
		template,
		templateLock,
		templateInsertUpdatesSelection,
		__experimentalCaptureToolbars: captureToolbars,
		__experimentalAppenderTagName,
		renderAppender,
		orientation,
		value,
		onChange,
	};

	const component = (
		<TagName { ...innerBlocksProps }>
			<InnerBlocks
				{ ...options }
				clientId={ clientId }
				wrapperRef={ wrapperRef }
			/>
		</TagName>
	);

	if ( TagName ) {
		return component;
	}

	return <div className="block-editor-inner-blocks">{ component }</div>;
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
