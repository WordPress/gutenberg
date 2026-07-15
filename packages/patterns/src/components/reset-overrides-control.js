/**
 * WordPress dependencies
 */
import {
	store as blockEditorStore,
	__unstableBlockToolbarLastItem as BlockToolbarLastItem,
} from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useRegistry, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export function getPatternOverridesProvider( select, clientId ) {
	const { getBlockName, getBlockParents } = select( blockEditorStore );
	const { getBlockType } = select( blocksStore );
	const patternClientId = getBlockParents( clientId, true ).find(
		( parentId ) =>
			getBlockType( getBlockName( parentId ) )?.providesContext?.[
				'pattern/overrides'
			]
	);

	if ( ! patternClientId ) {
		return;
	}

	return {
		clientId: patternClientId,
		attributeName: getBlockType( getBlockName( patternClientId ) )
			.providesContext[ 'pattern/overrides' ],
	};
}

export default function ResetOverridesControl( props ) {
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

			const { getBlockAttributes } = select( blockEditorStore );
			const overrides = getBlockAttributes( provider.clientId )[
				provider.attributeName
			];

			if ( ! overrides ) {
				return;
			}

			return Object.prototype.hasOwnProperty.call( overrides, name );
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

		const { getBlockAttributes } = registry.select( blockEditorStore );
		const overrides = getBlockAttributes( provider.clientId )[
			provider.attributeName
		];

		if (
			! overrides ||
			! Object.prototype.hasOwnProperty.call( overrides, name )
		) {
			return;
		}

		const { updateBlockAttributes, __unstableMarkLastChangeAsPersistent } =
			registry.dispatch( blockEditorStore );
		__unstableMarkLastChangeAsPersistent();

		let newOverrides = { ...overrides };
		delete newOverrides[ name ];

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
