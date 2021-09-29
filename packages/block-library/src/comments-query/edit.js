/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { cloneBlock } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
import {
	BlockControls,
	InspectorControls,
	useBlockProps,
	useSetting,
	store as blockEditorStore,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	__experimentalBlockPatternSetup as BlockPatternSetup,
} from '@wordpress/block-editor';
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import QueryToolbar from './toolbar';

/**
 * Recurses over a list of blocks and returns the clientId
 * of the first found Post Comments Query Loop block.
 *
 * @param {WPBlock[]} blocks The list of blocks to look through.
 * @return {string=} The clientId.
 */
export const getFirstQueryClientIdFromBlocks = ( blocks ) => {
	const blocksQueue = [ ...blocks ];
	while ( blocksQueue.length > 0 ) {
		const block = blocksQueue.shift();
		if ( block.name === 'core/comments-query' ) {
			return block.clientId;
		}
		block.innerBlocks?.forEach( ( innerBlock ) => {
			blocksQueue.push( innerBlock );
		} );
	}
};

// XXX: Update the stub comments-template
const TEMPLATE = [ [ 'core/comments-template' ] ];

export function QueryContent( { attributes, setAttributes } ) {
	const {
		queryId,
		query,
		displayLayout,
		tagName: TagName = 'div',
		layout = {},
	} = attributes;
	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch(
		blockEditorStore
	);

	const instanceId = useInstanceId( QueryContent );
	const { themeSupportsLayout } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return { themeSupportsLayout: getSettings()?.supportsLayout };
	}, [] );

	const defaultLayout = useSetting( 'layout' ) || {};
	const usedLayout = !! layout && layout.inherit ? defaultLayout : layout;
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		__experimentalLayout: themeSupportsLayout ? usedLayout : undefined,
	} );

	useEffect( () => {
		if ( ! queryId ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { queryId: instanceId } );
		}
	}, [ queryId, instanceId ] );
	const updateQuery = ( newQuery ) =>
		setAttributes( { query: { ...query, ...newQuery } } );
	const updateDisplayLayout = ( newDisplayLayout ) =>
		setAttributes( {
			displayLayout: { ...displayLayout, ...newDisplayLayout },
		} );

	return (
		<>
			{ /* XXX: Add query inspector controls here */ }
			<BlockControls>
				<QueryToolbar
					attributes={ attributes }
					setQuery={ updateQuery }
					setDisplayLayout={ updateDisplayLayout }
				/>
			</BlockControls>
			<InspectorControls __experimentalGroup="advanced">
				<SelectControl
					label={ __( 'HTML element' ) }
					options={ [
						{ label: __( 'Default (<div>)' ), value: 'div' },
						{ label: '<section>', value: 'section' },
						{ label: '<aside>', value: 'aside' },
					] }
					value={ TagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
				/>
			</InspectorControls>
			<TagName { ...innerBlocksProps } />
		</>
	);
}

const QueryPlaceholder = () => {
	const blockProps = useBlockProps();

	// XXX: Here will be a proper placeholder
	return (
		<div { ...blockProps }> QueryPlacholder: Actually implement this </div>
	);
};

const QueryPatternSetup = ( props ) => {
	const { clientId, name: blockName } = props;
	const blockProps = useBlockProps();
	const { replaceBlock, selectBlock } = useDispatch( blockEditorStore );
	const onBlockPatternSelect = ( blocks ) => {
		const clonedBlocks = blocks.map( ( block ) => cloneBlock( block ) );

		const firstQueryClientId = getFirstQueryClientIdFromBlocks(
			clonedBlocks
		);

		replaceBlock( clientId, clonedBlocks );
		if ( firstQueryClientId ) {
			selectBlock( firstQueryClientId );
		}
	};

	// `startBlankComponent` is what to render when clicking `Start blank`
	// or if no matched patterns are found.
	return (
		<div { ...blockProps }>
			<BlockPatternSetup
				blockName={ blockName }
				clientId={ clientId }
				startBlankComponent={
					// XXX: create a proper query placeholder here
					<QueryPlaceholder { ...props } />
				}
				onBlockPatternSelect={ onBlockPatternSelect }
			/>
		</div>
	);
};

const CommentsQueryEdit = ( props ) => {
	const { clientId } = props;
	const hasInnerBlocks = useSelect(
		( select ) =>
			!! select( blockEditorStore ).getBlocks( clientId ).length,
		[ clientId ]
	);
	const Component = hasInnerBlocks ? QueryContent : QueryPatternSetup;
	return <Component { ...props } />;
};

export default CommentsQueryEdit;
