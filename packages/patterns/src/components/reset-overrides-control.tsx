import {
	store as blockEditorStore,
	__unstableBlockToolbarLastItem as BlockToolbarLastItem,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useRegistry, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import type { PatternOverrides } from '../store/types';
import type { ResetOverridesControlProps } from './types';

const CONTENT = 'content';

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

			const { getBlockAttributes, getBlockParentsByBlockName } =
				select( blockEditorStore );
			const [ patternClientId ] = getBlockParentsByBlockName(
				props.clientId,
				'core/block',
				true
			);

			if ( ! patternClientId ) {
				return;
			}

			// The pattern block exists, and keeps its overrides in `content`.
			const overrides = getBlockAttributes( patternClientId )![
				CONTENT
			] as PatternOverrides | undefined;

			if ( ! overrides ) {
				return;
			}

			return overrides.hasOwnProperty( name );
		},
		[ props.clientId, name ]
	);

	function onClick() {
		const { getBlockAttributes, getBlockParentsByBlockName } =
			registry.select( blockEditorStore );
		const [ patternClientId ] = getBlockParentsByBlockName(
			props.clientId,
			'core/block',
			true
		);

		if ( ! patternClientId ) {
			return;
		}

		// The button is only enabled once the pattern block has overrides.
		const overrides = getBlockAttributes( patternClientId )![
			CONTENT
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

		updateBlockAttributes( patternClientId, {
			[ CONTENT ]: newOverrides,
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
