import { SwitchControl } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '../components';
import { useBlockEditingMode } from '../components/block-editing-mode';
import { store as blockEditorStore } from '../store';
import { isPatternGroupingEnabled } from '../utils/pattern-grouping';

type Metadata = Record< string, unknown > & { allowReordering?: boolean };

interface ContentGroupReorderingControlProps {
	clientId: string;
	metadata?: Metadata;
	setAttributes: ( attributes: { metadata?: Metadata } ) => void;
}

/**
 * Lets a pattern author allow the groups inside a container, for example the
 * cards in a grid, to be reordered while the pattern's design is locked. The
 * setting is stored as `metadata.allowReordering` on the container.
 *
 * @param props               Block props.
 * @param props.clientId      Client ID of the block.
 * @param props.metadata      The block's `metadata` attribute.
 * @param props.setAttributes Updates the block's attributes.
 */
function ContentGroupReorderingControl( {
	clientId,
	metadata,
	setAttributes,
}: ContentGroupReorderingControlProps ) {
	const blockEditingMode = useBlockEditingMode();
	const hasInnerBlocks = useSelect(
		( select ) => select( blockEditorStore ).getBlockCount( clientId ) > 0,
		[ clientId ]
	);

	if ( blockEditingMode !== 'default' || ! hasInnerBlocks ) {
		return null;
	}

	return (
		<InspectorControls group="advanced">
			<SwitchControl
				label={ __( 'Allow reordering in patterns' ) }
				description={ __(
					'When the pattern’s design is locked, people can reorder the named blocks inside this one.'
				) }
				checked={ !! metadata?.allowReordering }
				onCheckedChange={ ( allowReordering: boolean ) => {
					const { allowReordering: _, ...rest } = metadata ?? {};
					const nextMetadata: Metadata = allowReordering
						? { ...rest, allowReordering: true }
						: rest;
					setAttributes( {
						metadata: Object.keys( nextMetadata ).length
							? nextMetadata
							: undefined,
					} );
				} }
			/>
		</InspectorControls>
	);
}

export default {
	edit: ContentGroupReorderingControl,
	attributeKeys: [ 'metadata' ],
	hasSupport() {
		return isPatternGroupingEnabled();
	},
};
