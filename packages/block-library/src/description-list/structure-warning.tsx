import { PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import {
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';

const DESCRIPTION_LIST = 'core/description-list';
const DESCRIPTION_TERM = 'core/description-term';
const DESCRIPTION_DETAIL = 'core/description-detail';

type StructureIssue =
	| 'unexpected-child'
	| 'invalid-boundaries'
	| 'invalid-start'
	| 'invalid-end'
	| null;

function getStructureIssue(
	blockNames: Array< string | null >
): StructureIssue {
	if ( blockNames.length === 0 ) {
		return null;
	}

	if (
		blockNames.some(
			( blockName ) =>
				blockName !== DESCRIPTION_TERM &&
				blockName !== DESCRIPTION_DETAIL
		)
	) {
		return 'unexpected-child';
	}

	const hasInvalidStart = blockNames[ 0 ] !== DESCRIPTION_TERM;
	const hasInvalidEnd =
		blockNames[ blockNames.length - 1 ] !== DESCRIPTION_DETAIL;

	if ( hasInvalidStart && hasInvalidEnd ) {
		return 'invalid-boundaries';
	}

	if ( hasInvalidStart ) {
		return 'invalid-start';
	}

	if ( hasInvalidEnd ) {
		return 'invalid-end';
	}

	return null;
}

function getWarningMessage( issue: Exclude< StructureIssue, null > ) {
	switch ( issue ) {
		case 'unexpected-child':
			return __(
				'Description Lists can only contain terms and descriptions. Remove other blocks or change their types.'
			);
		case 'invalid-start':
			return __(
				'Start this list with a term. Reorder blocks or change their types.'
			);
		case 'invalid-end':
			return __(
				'End this list with a description. Reorder blocks or change their types.'
			);
		case 'invalid-boundaries':
			return __(
				'Start this list with a term and end it with a description. Reorder blocks or change their types to complete the list.'
			);
	}
}

export default function DescriptionListStructureWarning( {
	clientId,
	isSelected,
}: {
	clientId: string;
	isSelected: boolean;
} ) {
	if ( ! isSelected ) {
		return null;
	}

	return <SelectedBlockStructureWarning clientId={ clientId } />;
}

function SelectedBlockStructureWarning( { clientId }: { clientId: string } ) {
	const issue = useSelect(
		( select ) => {
			const { getBlockName, getBlockOrder, getBlockRootClientId } =
				select( blockEditorStore );
			const descriptionListClientId =
				getBlockName( clientId ) === DESCRIPTION_LIST
					? clientId
					: getBlockRootClientId( clientId );

			if (
				! descriptionListClientId ||
				getBlockName( descriptionListClientId ) !== DESCRIPTION_LIST
			) {
				return null;
			}

			return getStructureIssue(
				getBlockOrder( descriptionListClientId ).map( getBlockName )
			);
		},
		[ clientId ]
	);

	if ( ! issue ) {
		return null;
	}

	return (
		<InspectorControls group="settings">
			<PanelBody title={ __( 'Description List structure' ) }>
				<Notice.Root intent="warning">
					<Notice.Description>
						{ getWarningMessage( issue ) }
					</Notice.Description>
				</Notice.Root>
			</PanelBody>
		</InspectorControls>
	);
}
