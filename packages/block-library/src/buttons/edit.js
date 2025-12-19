/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { PrivateListView } = unlock( blockEditorPrivateApis );

const DEFAULT_BLOCK = {
	name: 'core/button',
	attributesToCopy: [
		'backgroundColor',
		'border',
		'className',
		'fontFamily',
		'fontSize',
		'gradient',
		'style',
		'textColor',
		'width',
	],
};

function ButtonsEdit( { attributes, className, clientId } ) {
	const { fontSize, layout, style } = attributes;
	const blockProps = useBlockProps( {
		className: clsx( className, {
			'has-custom-font-size': fontSize || style?.typography?.fontSize,
		} ),
	} );
	const { hasButtonVariations, hasChildren } = useSelect(
		( select ) => {
			const buttonVariations = select( blocksStore ).getBlockVariations(
				'core/button',
				'inserter'
			);
			return {
				hasButtonVariations: buttonVariations.length > 0,
				hasChildren:
					!! select( blockEditorStore ).getBlockCount( clientId ),
			};
		},
		[ clientId ]
	);

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		defaultBlock: DEFAULT_BLOCK,
		// This check should be handled by the `Inserter` internally to be consistent across all blocks that use it.
		directInsert: ! hasButtonVariations,
		template: [ [ 'core/button' ] ],
		templateInsertUpdatesSelection: true,
		orientation: layout?.orientation ?? 'horizontal',
	} );

	return (
		<>
			<InspectorControls group="list">
				<PanelBody title={ null }>
					{ ! hasChildren && (
						<p className="block-editor-block-inspector__no-blocks">
							{ __( 'No buttons yet.' ) }
						</p>
					) }
					<PrivateListView
						rootClientId={ clientId }
						isExpanded
						description={ __( 'Buttons' ) }
						showAppender
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}

export default ButtonsEdit;
