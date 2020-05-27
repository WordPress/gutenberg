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

const getSlotName = ( clientId ) => `BlockSettings-${ clientId }`;
const BlockSettingsMenuControlsSlots = ( { fillProps, clientIds = null } ) => {
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
			<BlockSettingsMenuControlsSlot { ...slotProps } />
			{ clientIds.length === 1 && (
				<BlockSettingsMenuControlsSlot
					{ ...slotProps }
					name={ getSlotName( clientIds[ 0 ] ) }
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
	...fillProps
} ) => {
	const context = useContext( BlockListBlockContext );
	if ( ! forAllBlocks ) {
		// Let's use non-existent ID in case the context is missing
		const clientId = context?.clientId || 'non-such-id';
		fillProps.name = getSlotName( clientId );
	}

	return <Fill { ...fillProps } />;
};

BlockSettingsMenuControls.Slot = BlockSettingsMenuControlsSlots;

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/block-settings-menu-controls/README.md
 */
export default BlockSettingsMenuControls;
