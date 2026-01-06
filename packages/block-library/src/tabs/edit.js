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
	BlockContextProvider,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Controls from './controls';

const TABS_TEMPLATE = [
	[ 'core/tabs-menu', {
		lock: {
			remove: true,
		}
	} ],
	[ 'core/tab-panels', {
		lock: {
			remove: true,
		}
	}, [ [ 'core/tab', {} ] ] ],
];

function Edit( { clientId, attributes, setAttributes } ) {
	const { orientation, activeTabIndex, editorActiveTabIndex } = attributes;

	/**
	 * Initialize editorActiveTabIndex to activeTabIndex on mount.
	 * This ensures the ephemeral editor state starts at the persisted default.
	 */
	useEffect( () => {
		if ( editorActiveTabIndex === undefined ) {
			setAttributes( { editorActiveTabIndex: activeTabIndex } );
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	/**
	 * Compute tabs list from innerblocks to provide via context.
	 * This traverses the tab-panels block to find all tab blocks
	 * and extracts their label and anchor for the tabs-menu to consume.
	 */
	const tabsList = useSelect(
		( select ) => {
			const { getBlocks } = select( blockEditorStore );
			const innerBlocks = getBlocks( clientId );

			// Find tab-panels block and extract tab data
			const tabPanels = innerBlocks.find(
				( block ) => block.name === 'core/tab-panels'
			);

			if ( ! tabPanels ) {
				return [];
			}

			return tabPanels.innerBlocks
				.filter( ( block ) => block.name === 'core/tab' )
				.map( ( tab, index ) => ( {
					id: tab.attributes.anchor || `tab-${ index }`,
					label: tab.attributes.label || '',
					clientId: tab.clientId,
					index,
				} ) );
		},
		[ clientId ]
	);

	/**
	 * Memoize context value to prevent unnecessary re-renders.
	 */
	const contextValue = useMemo(
		() => ( {
			'core/tabs-list': tabsList,
			'core/tabs-id': attributes.tabsId || '',
			'core/tabs-activeTabIndex': activeTabIndex,
			'core/tabs-editorActiveTabIndex': editorActiveTabIndex,
		} ),
		[ tabsList, attributes.tabsId, activeTabIndex, editorActiveTabIndex ]
	);

	/**
	 * Block props for the tabs container.
	 */
	const blockProps = useBlockProps( {
		className: clsx(
			'vertical' === orientation ? 'is-vertical' : 'is-horizontal'
		),
	} );

	/**
	 * Innerblocks props for the tabs container.
	 */
	const innerBlockProps = useInnerBlocksProps( blockProps, {
		template: TABS_TEMPLATE,
		templateLock: false,
		renderAppender: false,
	} );

	return (
		<BlockContextProvider value={ contextValue }>
			<div { ...innerBlockProps }>
				{ innerBlockProps.children }
				<Controls
					clientId={ clientId }
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			</div>
		</BlockContextProvider>
	);
}

export default Edit;
