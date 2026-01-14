/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { Icon, plus } from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * "Add Tab" render appender button for the tabs-menu block.
 * Displays as a floating button (matching standard inner blocks appender style)
 * and inserts new tabs into the tab-panels block.
 *
 * @param {Object} props
 * @param {string} props.tabsClientId The client ID of the parent tabs block.
 * @return {JSX.Element} The appender button element.
 */
export default function AddTabRenderAppender( { tabsClientId } ) {
	const { insertBlock } = useDispatch( blockEditorStore );

	// Find the tab-panels block within the tabs block
	const { tabPanelsClientId, nextTabIndex } = useSelect(
		( select ) => {
			if ( ! tabsClientId ) {
				return {
					tabPanelsClientId: null,
					nextTabIndex: 0,
				};
			}
			const { getBlocks } = select( blockEditorStore );
			const innerBlocks = getBlocks( tabsClientId );
			const tabPanels = innerBlocks.find(
				( block ) => block.name === 'core/tab-panels'
			);
			return {
				tabPanelsClientId: tabPanels?.clientId || null,
				nextTabIndex: ( tabPanels?.innerBlocks.length || 0 ) + 1,
			};
		},
		[ tabsClientId ]
	);

	const addTab = () => {
		if ( ! tabPanelsClientId ) {
			return;
		}
		const newTabBlock = createBlock( 'core/tab', {
			anchor: 'tab-' + nextTabIndex,
			/* translators: %d: tab number */
			label: sprintf( __( 'Tab %d' ), nextTabIndex ),
		} );
		insertBlock( newTabBlock, undefined, tabPanelsClientId );
	};

	return (
		<Button
			__next40pxDefaultSize
			className="block-editor-button-block-appender add-tab-render-appender"
			onClick={ addTab }
			label={ __( 'Add a new tab' ) }
			showTooltip
			tabIndex={ -1 }
			style={{
				position: 'absolute',
				right: 0,
				bottom: 0,
				width: '3em',
			}}
		>
			<Icon icon={ plus } />
		</Button>
	);
}
