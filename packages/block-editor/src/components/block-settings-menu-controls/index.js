/**
 * External dependencies
 */
import { isEmpty, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { createSlotFill, MenuGroup } from '@wordpress/components';
import { useContext } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { BlockListBlockContext } from '../block-list/block';

const { Fill, Slot } = createSlotFill( 'BlockSettingsMenuControls' );

const getSlotName = ( context, clientId = null ) =>
	`BlockSettings-${ context }-${ clientId ? clientId : '' }`;
const BlockSettingsMenuControlsSlots = ( {
	fillProps,
	context = 'default',
	clientIds = null,
} ) => {
	const { selectedBlocks } = useSelect( ( select ) => {
		const { getBlocksByClientId, getSelectedBlockClientIds } = select(
			'core/block-editor'
		);
		const ids =
			clientIds !== null ? clientIds : getSelectedBlockClientIds();
		return {
			selectedBlocks: map(
				getBlocksByClientId( ids ),
				( block ) => block.name
			),
		};
	}, [] );

	const slotProps = { ...fillProps, selectedBlocks };
	return (
		<>
			<BlockSettingsMenuControlsSlot
				{ ...slotProps }
				name={ getSlotName( context ) }
			/>
			{ clientIds.length === 1 && (
				<BlockSettingsMenuControlsSlot
					{ ...slotProps }
					name={ getSlotName( context, clientIds[ 0 ] ) }
				/>
			) }
		</>
	);
};

const BlockSettingsMenuControlsSlot = ( props ) => (
	<Slot { ...props }>
		{ ( fills ) => ! isEmpty( fills ) && <MenuGroup>{ fills }</MenuGroup> }
	</Slot>
);

export const BlockSettingsMenuControls = ( {
	forAllBlocks = false,
	context = 'default',
	...fillProps
} ) => {
	const blockContext = useContext( BlockListBlockContext );
	let clientId;
	if ( ! forAllBlocks ) {
		// Let's use non-existent ID in case the block context is missing
		clientId = blockContext?.clientId || 'non-such-id';
	}
	return <Fill { ...fillProps } name={ getSlotName( context, clientId ) } />;
};

BlockSettingsMenuControls.Slot = BlockSettingsMenuControlsSlots;

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/block-settings-menu-controls/README.md
 */
export default BlockSettingsMenuControls;
