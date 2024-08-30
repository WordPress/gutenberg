/**
 * WordPress dependencies
 */
import { __unstableGetInnerBlocksProps as getInnerBlocksProps } from '@wordpress/blocks';
import { useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ButtonBlockAppender from './button-block-appender';
import DefaultBlockAppender from './default-block-appender';
import useNestedSettingsUpdate from './use-nested-settings-update';
import useInnerBlockTemplateSync from './use-inner-block-template-sync';
import useBlockContext from './use-block-context';

/**
 * Internal dependencies
 */
import BlockList from '../block-list';
import { useBlockEditContext } from '../block-edit/context';
import useBlockSync from '../provider/use-block-sync';
import { BlockContextProvider } from '../block-context';
import { defaultLayout, LayoutProvider } from '../block-list/layout';
import { store as blockEditorStore } from '../../store';
import WarningMaxDepthExceeded from './warning-max-depth-exceeded';
import { MAX_NESTING_DEPTH } from './constants';

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
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/inner-blocks/README.md
 */
export function useInnerBlocksProps( props = {}, options = {} ) {
	const fallbackRef = useRef();
	const { clientId } = useBlockEditContext();

	const ref = props.ref || fallbackRef;
	const InnerBlocks =
		options.value && options.onChange
			? ControlledInnerBlocks
			: UncontrolledInnerBlocks;

	return {
		...props,
		ref,
		children: (
			<InnerBlocks
				{ ...options }
				clientId={ clientId }
				wrapperRef={ ref }
			/>
		),
	};
}

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
		prioritizedInserterBlocks,
		defaultBlock,
		directInsert,
		__experimentalDefaultBlock,
		__experimentalDirectInsert,
		template,
		templateLock,
		templateInsertUpdatesSelection,
		__experimentalCaptureToolbars: captureToolbars,
		orientation,
		renderAppender,
		renderFooterAppender,
		parentWidth,
		horizontal,
		contentResizeMode,
		contentStyle,
		onAddBlock,
		onDeleteBlock,
		marginVertical,
		marginHorizontal,
		horizontalAlignment,
		filterInnerBlocks,
		blockWidth,
		layout = defaultLayout,
		gridProperties,
	} = props;

	const context = useBlockContext( clientId );

	const { nestingLevel, parentLock } = useSelect(
		( select ) => {
			const { getBlockParents, getTemplateLock, getBlockRootClientId } =
				select( blockEditorStore );
			return {
				nestingLevel: getBlockParents( clientId )?.length,
				parentLock: getTemplateLock( getBlockRootClientId( clientId ) ),
			};
		},
		[ clientId ]
	);

	useNestedSettingsUpdate(
		clientId,
		parentLock,
		allowedBlocks,
		prioritizedInserterBlocks,
		defaultBlock,
		directInsert,
		__experimentalDefaultBlock,
		__experimentalDirectInsert,
		templateLock,
		captureToolbars,
		orientation,
		layout
	);

	useInnerBlockTemplateSync(
		clientId,
		template,
		templateLock,
		templateInsertUpdatesSelection
	);

	if ( nestingLevel >= MAX_NESTING_DEPTH ) {
		return <WarningMaxDepthExceeded clientId={ clientId } />;
	}

	return (
		<LayoutProvider value={ layout }>
			<BlockContextProvider value={ context }>
				<BlockList
					marginVertical={ marginVertical }
					marginHorizontal={ marginHorizontal }
					rootClientId={ clientId }
					renderAppender={ renderAppender }
					renderFooterAppender={ renderFooterAppender }
					withFooter={ false }
					orientation={ orientation }
					parentWidth={ parentWidth }
					horizontalAlignment={ horizontalAlignment }
					horizontal={ horizontal }
					contentResizeMode={ contentResizeMode }
					contentStyle={ contentStyle }
					onAddBlock={ onAddBlock }
					onDeleteBlock={ onDeleteBlock }
					filterInnerBlocks={ filterInnerBlocks }
					gridProperties={ gridProperties }
					blockWidth={ blockWidth }
				/>
			</BlockContextProvider>
		</LayoutProvider>
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

/**
 * Wrapped InnerBlocks component which detects whether to use the controlled or
 * uncontrolled variations of the InnerBlocks component. This is the component
 * which should be used throughout the application.
 *
 * @param {Object} props The component props.
 */
const InnerBlocks = ( props ) => {
	const { clientId } = useBlockEditContext();

	const allProps = {
		clientId,
		...props,
	};

	// Detects if the InnerBlocks should be controlled by an incoming value.
	return props.value && props.onChange ? (
		<ControlledInnerBlocks { ...allProps } />
	) : (
		<UncontrolledInnerBlocks { ...allProps } />
	);
};

// Expose default appender placeholders as components.
InnerBlocks.DefaultBlockAppender = DefaultBlockAppender;
InnerBlocks.ButtonBlockAppender = ButtonBlockAppender;

useInnerBlocksProps.save = getInnerBlocksProps;

InnerBlocks.Content = () => useInnerBlocksProps.save().children;

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inner-blocks/README.md
 */
export default InnerBlocks;
