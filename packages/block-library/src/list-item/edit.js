/**
 * External dependencies
 */
import { cloneDeep } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import {
	createBlock,
	getDefaultBlockName,
	cloneBlock,
} from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';

function splitList( topParentListBlock, blockParents, clientId ) {
	const remainingBlocks = [];
	// We cloneDeep with lodash here because we mutate the top list block
	// and we can't use `cloneBlock` because we need to traverse with
	// specific block clientIds.
	const parentClone = cloneDeep( topParentListBlock );
	let parent = parentClone;
	const parentIds = [ ...blockParents.slice( 1 ), clientId ];
	parentIds.forEach( ( parentClientId, index ) => {
		const matchIndex = parent.innerBlocks.findIndex(
			( innerBlock ) => innerBlock.clientId === parentClientId
		);
		const matchParent = parent.innerBlocks[ matchIndex ];
		const blocksAfter = parent.innerBlocks.slice( matchIndex + 1 );
		if ( blocksAfter.length ) {
			remainingBlocks.unshift( ...blocksAfter );
		}
		// Last parent item by might be a non empty `list`, so append
		// remaining innerBlocks blocks if any.
		const isLastMatch = parentIds.length === index + 1;
		if (
			isLastMatch &&
			matchParent.innerBlocks?.[ 0 ]?.innerBlocks?.length
		) {
			remainingBlocks.unshift(
				...matchParent.innerBlocks[ 0 ].innerBlocks
			);
		}
		// In last parent block don't include the last(empty) list-item.
		parent.innerBlocks = parent.innerBlocks.slice(
			0,
			isLastMatch ? matchIndex : matchIndex + 1
		);
		parent = matchParent;
	} );
	return { beforeBlock: parentClone, remainingBlocks };
}

export default function ListItemEdit( props ) {
	const {
		attributes,
		setAttributes,
		name,
		onReplace,
		mergeBlocks,
		clientId,
	} = props;
	const { placeholder, content } = attributes;
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const { topParentListBlock, blockParents } = useSelect(
		( select ) => {
			const {
				getBlockParents,
				getBlock,
				getBlockParentsByBlockName,
			} = select( blockEditorStore );
			return {
				topParentListBlock: getBlock(
					getBlockParentsByBlockName( clientId, 'core/list' )[ 0 ]
				),
				blockParents: getBlockParents( clientId ),
			};
		},
		[ clientId ]
	);
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'core/list' ],
	} );

	const onSplit = ( value ) => {
		if ( ! content.length && ! value.length ) {
			const { beforeBlock, remainingBlocks } = splitList(
				topParentListBlock,
				blockParents,
				clientId
			);
			const extraBlocks = [ createBlock( getDefaultBlockName() ) ];
			if ( remainingBlocks.length ) {
				extraBlocks.push(
					createBlock(
						'core/list',
						{},
						remainingBlocks.map( ( block ) => cloneBlock( block ) )
					)
				);
			}
			replaceBlocks(
				topParentListBlock.clientId,
				[ cloneBlock( beforeBlock ), ...extraBlocks ],
				1
			);
			return;
		}
		return createBlock( name, {
			...attributes,
			content: value,
		} );
	};

	return (
		<li { ...innerBlocksProps }>
			<RichText
				identifier="content"
				tagName="div"
				onChange={ ( nextContent ) =>
					setAttributes( { content: nextContent } )
				}
				value={ content }
				aria-label={ __( 'List text' ) }
				placeholder={ placeholder || __( 'List' ) }
				onSplit={ onSplit }
				onMerge={ mergeBlocks }
				onReplace={ onReplace }
			/>
			{ innerBlocksProps.children }
		</li>
	);
}
