import type { ComponentType, ReactNode } from 'react';
import {
	createBlock,
	getBlockType,
	registerBlockType,
} from '@wordpress/blocks';
import { DropdownMenu, MenuItem } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import BlockSettingsMenuControls from '../';
import { ExperimentalBlockEditorProvider } from '../../provider';
import { store as blockEditorStore } from '../../../store';

const BLOCK_NAME = 'storybook/example';
const BLOCK_LABELS = [ 'First', 'Second' ];

const clientIds = BLOCK_LABELS.map(
	( label, index ) => `example-block-${ index + 1 }`
);

const clientIdLabels = Object.fromEntries(
	clientIds.map( ( clientId, index ) => [
		clientId,
		`${ BLOCK_LABELS[ index ] } block`,
	] )
);

function useExampleBlocks() {
	return useMemo( () => {
		if ( ! getBlockType( BLOCK_NAME ) ) {
			registerBlockType( BLOCK_NAME, {
				apiVersion: 3,
				title: 'Example',
				category: 'text',
				attributes: {
					content: { type: 'string' },
				},
				edit: () => null,
				save: () => null,
			} );
		}

		return BLOCK_LABELS.map( ( label, index ) => ( {
			...createBlock( BLOCK_NAME, {
				content: `${ label } example block.`,
			} ),
			clientId: clientIds[ index ],
		} ) );
	}, [] );
}

function WhenBlocksAreReady( { children }: { children: ReactNode } ) {
	const hasBlocks = useSelect(
		( select ) =>
			!! select( blockEditorStore ).getBlockName( clientIds[ 0 ] ),
		[]
	);

	return hasBlocks ? children : null;
}

const providerSettings = { codeEditingEnabled: true };

const storyStyles = `
	.block-settings-menu-controls-story {
		min-height: 240px;
	}
`;

const sourceCode = `function MyPluginMenuItem() {
	return (
		<BlockSettingsMenuControls>
			{ ( { selectedClientIds, onClose } ) => (
				<MenuItem onClick={ () => convert( selectedClientIds, onClose ) }>
					Convert to my block
				</MenuItem>
			) }
		</BlockSettingsMenuControls>
	);
}

<BlockSettingsMenuControls.Slot
	clientIds={ clientIds }
	fillProps={ { onClose, count, firstBlockClientId } }
/>`;

const meta = {
	title: 'BlockEditor/BlockSettingsMenuControls',
	component: BlockSettingsMenuControls,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'BlockSettingsMenuControls is the fill that adds items to the block settings dropdown menu of a block. The matching `BlockSettingsMenuControls.Slot` renders those fills next to the built-in items, such as lock, rename, and edit as HTML, so both have to be rendered within a block editor provider. The controls below are the props of the Slot.',
			},
			source: { code: sourceCode },
		},
	},
	decorators: [
		( Story: ComponentType ) => {
			const blocks = useExampleBlocks();

			return (
				<ExperimentalBlockEditorProvider
					value={ blocks }
					settings={ providerSettings }
				>
					<WhenBlocksAreReady>
						<div className="block-settings-menu-controls-story">
							<style>{ storyStyles }</style>
							<Story />
						</div>
					</WhenBlocksAreReady>
				</ExperimentalBlockEditorProvider>
			);
		},
	],
	argTypes: {
		clientIds: {
			control: { type: 'check', labels: clientIdLabels },
			options: clientIds,
			description:
				'The client IDs of the blocks the menu items act upon. Defaults to the current block selection when omitted.',
			table: {
				type: { summary: 'string[]' },
			},
		},
		fillProps: {
			control: 'object',
			description:
				'Passed through to the fills, alongside `canEdit`, `selectedBlocks`, and `selectedClientIds`. A `count` of `1` together with a `firstBlockClientId` also renders the built-in block mode toggle.',
			table: {
				type: { summary: 'Object' },
			},
		},
	},
};

export default meta;

type SlotArgs = {
	clientIds: string[];
	fillProps: Record< string, unknown >;
};

export const Default = {
	args: {
		clientIds: [ clientIds[ 0 ] ],
		fillProps: {
			count: 1,
			firstBlockClientId: clientIds[ 0 ],
		},
	},
	render: function Template( { clientIds: ids, fillProps }: SlotArgs ) {
		return (
			<DropdownMenu
				defaultOpen
				icon={ moreVertical }
				label={ __( 'Options' ) }
				popoverProps={ { placement: 'bottom-start' } }
			>
				{ ( { onClose } ) => (
					<>
						<BlockSettingsMenuControls>
							{ ( {
								onClose: closeMenu,
							}: {
								onClose: () => void;
							} ) => (
								<MenuItem onClick={ closeMenu }>
									{ __( 'Example fill item' ) }
								</MenuItem>
							) }
						</BlockSettingsMenuControls>
						<BlockSettingsMenuControls.Slot
							clientIds={ ids }
							fillProps={ { ...fillProps, onClose } }
						/>
					</>
				) }
			</DropdownMenu>
		);
	},
};
