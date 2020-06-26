/**
 * WordPress dependencies
 */
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
import { useBlockEditContext } from '../block-edit/context';
import useBlockSync from '../provider/use-block-sync';
import { BlockContextProvider } from '../block-context';

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
		templateInsertUpdatesSelection,
		__experimentalMoverDirection,
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
	} = props;

	const block = useSelect(
		( select ) => select( 'core/block-editor' ).getBlock( clientId ),
		[ clientId ]
	) || { innerBlocks: [] };

	useNestedSettingsUpdate( clientId, allowedBlocks, templateLock );

	useInnerBlockTemplateSync(
		clientId,
		template,
		templateLock,
		templateInsertUpdatesSelection
	);

	let blockList = (
		<BlockList
			marginVertical={ marginVertical }
			marginHorizontal={ marginHorizontal }
			rootClientId={ clientId }
			renderAppender={ renderAppender }
			renderFooterAppender={ renderFooterAppender }
			withFooter={ false }
			__experimentalMoverDirection={ __experimentalMoverDirection }
			parentWidth={ parentWidth }
			horizontalAlignment={ horizontalAlignment }
			horizontal={ horizontal }
			contentResizeMode={ contentResizeMode }
			contentStyle={ contentStyle }
			onAddBlock={ onAddBlock }
			onDeleteBlock={ onDeleteBlock }
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

	return blockList;
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

InnerBlocks.Content = withBlockContentContext( ( { BlockContent } ) => (
	<BlockContent />
) );

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/inner-blocks/README.md
 */
export default InnerBlocks;
