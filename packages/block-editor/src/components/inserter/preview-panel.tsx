import {
	isReusableBlock,
	createBlock,
	getBlockFromExample,
} from '@wordpress/blocks';
import { createInterpolateElement, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import BlockCard from '../block-card';
import BlockPreview from '../block-preview';
import type { InserterItem } from '../../store/types';

function InserterPreviewPanel( { item }: { item: InserterItem } ) {
	const {
		name,
		title,
		icon,
		description,
		initialAttributes,
		example,
		isDisabled,
	} = item;
	const isReusable = isReusableBlock( item );
	const blocks = useMemo( () => {
		if ( ! example ) {
			return createBlock( name, initialAttributes );
		}
		return getBlockFromExample( name, {
			attributes: {
				...example.attributes,
				...initialAttributes,
			},
			innerBlocks: example.innerBlocks,
			innerContent: example.innerContent,
		} );
	}, [ name, example, initialAttributes ] );
	const previewHeight = 144;
	const sidebarWidth = 280;
	const viewportWidth = example?.viewportWidth ?? 500;
	const minHeight =
		previewHeight / Math.min( sidebarWidth / viewportWidth, 1 );

	return (
		<Stack
			direction="column"
			gap="lg"
			className="block-editor-inserter__preview-container"
		>
			{ isReusable || example ? (
				<div className="block-editor-inserter__preview-content">
					<BlockPreview
						blocks={ blocks }
						viewportWidth={ viewportWidth }
						minHeight={ previewHeight }
						additionalStyles={ [
							{
								css: `
								body {
									padding: 24px;
									min-height:${ Math.round( minHeight ) }px;
									display:flex;
									align-items:center;
								}
								.is-root-container { width: 100%; }
							`,
							},
						] }
					/>
				</div>
			) : (
				<div className="block-editor-inserter__preview-content-missing">
					{ __( 'No preview available.' ) }
				</div>
			) }
			<Stack direction="column" gap="sm">
				{ ! isReusable && (
					<BlockCard
						title={ title }
						icon={ icon }
						description={ description }
					/>
				) }
				{ isDisabled && (
					<Text render={ <p /> }>
						{ createInterpolateElement(
							__(
								'<strong>Note:</strong> This block can only be used once, and is already in use.'
							),
							{ strong: <strong /> }
						) }
					</Text>
				) }
			</Stack>
		</Stack>
	);
}

export default InserterPreviewPanel;
