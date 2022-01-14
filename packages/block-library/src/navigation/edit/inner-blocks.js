/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import {
	useInnerBlocksProps,
	__experimentalBlockContentOverlay as BlockContentOverlay,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PlaceholderPreview from './placeholder/placeholder-preview';
import navigationLinkMetadata from '../../navigation-link/block.json';

const ALLOWED_BLOCKS = [
	'core/navigation-link',
	'core/search',
	'core/social-links',
	'core/page-list',
	'core/spacer',
	'core/home-link',
	'core/site-title',
	'core/site-logo',
	'core/navigation-submenu',
];

// Set default block to use default or undefined attribute values when inserted.
const DEFAULT_BLOCK = [
	'core/navigation-link',
	{
		...Object.entries( navigationLinkMetadata.attributes ).reduce(
			( acc, attribute ) => ( {
				...acc,
				[ attribute[ 0 ] ]:
					attribute[ 1 ].default !== undefined
						? attribute[ 1 ].default
						: undefined,
			} ),
			{}
		),
	},
];

const LAYOUT = {
	type: 'default',
	alignments: [],
};

export default function NavigationInnerBlocks( {
	isVisible,
	clientId,
	appender: CustomAppender,
	hasCustomPlaceholder,
	orientation,
} ) {
	const {
		isImmediateParentOfSelectedBlock,
		selectedBlockHasDescendants,
		isSelected,
	} = useSelect(
		( select ) => {
			const {
				getClientIdsOfDescendants,
				hasSelectedInnerBlock,
				getSelectedBlockClientId,
			} = select( blockEditorStore );
			const selectedBlockId = getSelectedBlockClientId();

			return {
				isImmediateParentOfSelectedBlock: hasSelectedInnerBlock(
					clientId,
					false
				),
				selectedBlockHasDescendants: !! getClientIdsOfDescendants( [
					selectedBlockId,
				] )?.length,

				// This prop is already available but computing it here ensures it's
				// fresh compared to isImmediateParentOfSelectedBlock
				isSelected: selectedBlockId === clientId,
			};
		},
		[ clientId ]
	);

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_navigation'
	);

	const shouldDirectInsert = useMemo(
		() =>
			blocks.every(
				( { name } ) =>
					name === 'core/navigation-link' ||
					name === 'core/navigation-submenu' ||
					name === 'core/page-list'
			),
		[ blocks ]
	);

	// When the block is selected itself or has a top level item selected that
	// doesn't itself have children, show the standard appender. Else show no
	// appender.
	const parentOrChildHasSelection =
		isSelected ||
		( isImmediateParentOfSelectedBlock && ! selectedBlockHasDescendants );
	const appender = isVisible && parentOrChildHasSelection ? undefined : false;

	const placeholder = useMemo( () => <PlaceholderPreview />, [] );

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-navigation__container',
		},
		{
			value: blocks,
			onInput,
			onChange,
			allowedBlocks: ALLOWED_BLOCKS,
			__experimentalDefaultBlock: DEFAULT_BLOCK,
			__experimentalDirectInsert: shouldDirectInsert,
			orientation,
			renderAppender: CustomAppender || appender,
			// Template lock set to false here so that the Nav
			// Block on the experimental menus screen does not
			// inherit templateLock={ 'all' }.
			templateLock: false,
			__experimentalLayout: LAYOUT,
			placeholder:
				! isVisible || hasCustomPlaceholder ? undefined : placeholder,
		}
	);

	return (
		<BlockContentOverlay
			clientId={ clientId }
			tagName={ 'div' }
			wrapperProps={ innerBlocksProps }
		/>
	);
}
