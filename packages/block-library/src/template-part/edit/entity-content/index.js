/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import TemplatePartInnerBlocks from '../inner-blocks';
import PatternsSetup from './patterns-setup';

export default function EntityContent( {
	tagName,
	blockProps,
	postId,
	hasInnerBlocks,
	layout,
	clientId,
} ) {
	const [ startBlank, setStartBlank ] = useState( false );

	const { hasContent, blockNameWithArea } = useSelect(
		( select ) => {
			const entityRecord = select( coreStore ).getEditedEntityRecord(
				'postType',
				'wp_template_part',
				postId
			);

			const _hasContent =
				( entityRecord?.content &&
					typeof entityRecord.content !== 'function' ) ||
				entityRecord?.blocks?.length;

			const _blockNameWithArea =
				entityRecord?.area && entityRecord.area !== 'uncategorized'
					? `core/template-part/${ entityRecord.area }`
					: 'core/template-part';

			return {
				hasContent: _hasContent,
				blockNameWithArea: _blockNameWithArea,
			};
		},
		[ postId ]
	);

	useEffect( () => {
		if ( hasContent ) {
			setStartBlank( false );
		}
	}, [ hasContent ] );

	return (
		<>
			<TemplatePartInnerBlocks
				tagName={ tagName }
				blockProps={ blockProps }
				postId={ postId }
				hasInnerBlocks={ hasInnerBlocks }
				layout={ layout }
				startBlank={ startBlank }
			/>
			{ ! hasContent && ! startBlank && (
				<PatternsSetup
					blockNameWithArea={ blockNameWithArea }
					clientId={ clientId }
					setStartBlank={ setStartBlank }
				/>
			) }
		</>
	);
}
