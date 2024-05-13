/**
 * WordPress dependencies
 */
import {
	store as blockEditorStore,
	BlockControls,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useRegistry, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const CONTENT = 'content';

export default function ResetOverridesControl( props ) {
	const name = props.attributes.metadata?.name;
	const registry = useRegistry();
	const isOverriden = useSelect(
		( select ) => {
			if ( ! name ) {
				return;
			}

			const { getBlockAttributes, getBlockParents, getBlockName } =
				select( blockEditorStore );
			const parents = getBlockParents( props.clientId, true );
			const patternClientId = parents.find(
				( id ) => getBlockName( id ) === 'core/block'
			);

			if ( ! patternClientId ) {
				return;
			}

			const overrides = getBlockAttributes( patternClientId )[ CONTENT ];

			if ( ! overrides ) {
				return;
			}

			return overrides.hasOwnProperty( name );
		},
		[ props.clientId, name ]
	);

	function onClick() {
		const { getBlockAttributes, getBlockParents, getBlockName } =
			registry.select( blockEditorStore );
		const parents = getBlockParents( props.clientId, true );
		const patternClientId = parents.find(
			( id ) => getBlockName( id ) === 'core/block'
		);

		if ( ! patternClientId ) {
			return;
		}

		const overrides = getBlockAttributes( patternClientId )[ CONTENT ];

		if ( ! overrides.hasOwnProperty( name ) ) {
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

		updateBlockAttributes( patternClientId, {
			[ CONTENT ]: newOverrides,
		} );
	}

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				<ToolbarButton
					onClick={ onClick }
					disabled={ ! isOverriden }
					__experimentalIsFocusable
				>
					{ __( 'Reset' ) }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}
