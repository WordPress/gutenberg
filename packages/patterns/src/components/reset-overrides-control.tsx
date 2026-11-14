import {
	store as blockEditorStore,
	__unstableBlockToolbarLastItem as BlockToolbarLastItem,
} from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useRegistry, useSelect } from '@wordpress/data';
import type { DataRegistry } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import type { PatternOverrides } from '../store/types';
import type { ResetOverridesControlProps } from './types';

export function getPatternOverridesProvider(
	select: DataRegistry[ 'select' ],
	clientId: string
) {
	const { getBlockName, getBlockParents } = select( blockEditorStore );
	const { getBlockType } = select( blocksStore );
	// Parents always exist, so each one has a name.
	const patternClientId = getBlockParents( clientId, true ).find(
		( parentId ) =>
			getBlockType( getBlockName( parentId )! )?.providesContext?.[
				'pattern/overrides'
			]
	);

	if ( ! patternClientId ) {
		return;
	}

	return {
		clientId: patternClientId,
		// The search above only matches a block type with this mapping.
		attributeName: getBlockType( getBlockName( patternClientId )! )!
			.providesContext![ 'pattern/overrides' ],
	};
}

export default function ResetOverridesControl(
	props: ResetOverridesControlProps
) {
	const name = props.attributes.metadata?.name;
	const registry = useRegistry();
	const isOverridden = useSelect(
		( select ) => {
			if ( ! name ) {
				return;
			}

			const provider = getPatternOverridesProvider(
				select,
				props.clientId
			);

			if ( ! provider ) {
				return;
			}

			// The provider block exists, and keeps its overrides in its mapped attribute.
			const { getBlockAttributes } = select( blockEditorStore );
			const overrides = getBlockAttributes( provider.clientId )![
				provider.attributeName
			] as PatternOverrides | undefined;

			if ( ! overrides ) {
				return;
			}

			return overrides.hasOwnProperty( name );
		},
		[ props.clientId, name ]
	);

	function onClick() {
		const provider = getPatternOverridesProvider(
			registry.select,
			props.clientId
		);

		if ( ! provider ) {
			return;
		}

		// The button is only enabled once the provider block has overrides.
		const { getBlockAttributes } = registry.select( blockEditorStore );
		const overrides = getBlockAttributes( provider.clientId )![
			provider.attributeName
		] as PatternOverrides;

		// An enabled button means the block has a name, as `isOverridden` needs one.
		if ( ! overrides.hasOwnProperty( name! ) ) {
			return;
		}

		const { updateBlockAttributes, __unstableMarkLastChangeAsPersistent } =
			registry.dispatch( blockEditorStore );
		__unstableMarkLastChangeAsPersistent();

		let newOverrides: PatternOverrides | undefined = { ...overrides };
		// Checked above, under the same name.
		delete newOverrides[ name! ];

		if ( ! Object.keys( newOverrides ).length ) {
			newOverrides = undefined;
		}

		updateBlockAttributes( provider.clientId, {
			[ provider.attributeName ]: newOverrides,
		} );
	}

	return (
		<BlockToolbarLastItem>
			<ToolbarGroup>
				<ToolbarButton onClick={ onClick } disabled={ ! isOverridden }>
					{ __( 'Reset' ) }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockToolbarLastItem>
	);
}
