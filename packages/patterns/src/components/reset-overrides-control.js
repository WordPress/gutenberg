/**
 * WordPress dependencies
 */
import {
	store as blockEditorStore,
	BlockControls,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const CONTENT = 'content';

export default function ResetOverridesControl( props ) {
	const name = props.attributes.metadata?.name;
	const { syncDerivedUpdates } = unlock( useDispatch( blockEditorStore ) );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const { isOverriden, resetOverrides } = useSelect(
		( select ) => {
			if ( ! name ) {
				return undefined;
			}

			const { getBlockAttributes, getBlockParents, getBlockName } =
				select( blockEditorStore );
			const parents = getBlockParents( props.clientId, true );
			const patternClientId = parents.find(
				( id ) => getBlockName( id ) === 'core/block'
			);

			const patternAttributes = getBlockAttributes( patternClientId );
			const existingOverrides = patternAttributes?.[ CONTENT ];

			return {
				isOverriden: !! existingOverrides?.[ name ],
				resetOverrides: async () => {
					syncDerivedUpdates( () => {
						updateBlockAttributes( patternClientId, {
							[ CONTENT ]: {
								...existingOverrides,
								[ name ]: undefined,
							},
						} );
					} );
				},
			};
		},
		[ props.clientId, name ]
	);

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				<ToolbarButton
					onClick={ resetOverrides }
					disabled={ ! isOverriden }
					__experimentalIsFocusable
				>
					{ __( 'Reset' ) }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}
