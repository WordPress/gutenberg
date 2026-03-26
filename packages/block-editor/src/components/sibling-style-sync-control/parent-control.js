/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { getBlockTypes, getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InspectorControls from '../inspector-controls';

/**
 * Renders a "Style syncing" panel in a scope block's inspector (e.g. Accordion,
 * Tabs). Contains one ToggleControl per child block type that declares this
 * block as its `__experimentalSiblingStyleSync` scope.
 *
 * When a toggle is switched off, the sync propagation in
 * `__experimentalUpdateSyncedBlockAttributes` is bypassed for that child type
 * and each child block's inspector hides the sync notice.
 *
 * @param {Object}   props
 * @param {string}   props.name          Block name of the scope block.
 * @param {Object}   props.attributes    Block attributes (reads syncChildStyles).
 * @param {Function} props.setAttributes Block setAttributes.
 */
export function SiblingStyleSyncParentControl( {
	name,
	attributes,
	setAttributes,
} ) {
	const syncedChildTypes = useMemo(
		() =>
			getBlockTypes().filter(
				( type ) =>
					type.supports?.__experimentalSiblingStyleSync?.scope ===
					name
			),
		[ name ]
	);

	if ( syncedChildTypes.length === 0 ) {
		return null;
	}

	const { syncChildStyles = {} } = attributes;

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Copy styles' ) } initialOpen>
				{ syncedChildTypes.map( ( childType ) => {
					const isEnabled =
						syncChildStyles[ childType.name ] !== false;
					const blockTitle =
						getBlockType( childType.name )?.title ?? childType.name;
					return (
						<ToggleControl
							key={ childType.name }
							__nextHasNoMarginBottom
							label={ sprintf(
								/* translators: %s: block type name e.g. "Accordion Heading" */
								__( 'Copy styles to all %s blocks' ),
								blockTitle
							) }
							help={
								isEnabled
									? sprintf(
											/* translators: %s: block type name */
											__(
												'Style changes will be copied to all %s blocks in this group.'
											),
											blockTitle
									  )
									: sprintf(
											/* translators: %s: block type name */
											__(
												'Each %s block will have its own styles.'
											),
											blockTitle
									  )
							}
							checked={ isEnabled }
							onChange={ ( value ) =>
								setAttributes( {
									syncChildStyles: {
										...syncChildStyles,
										[ childType.name ]: value,
									},
								} )
							}
						/>
					);
				} ) }
			</PanelBody>
		</InspectorControls>
	);
}
