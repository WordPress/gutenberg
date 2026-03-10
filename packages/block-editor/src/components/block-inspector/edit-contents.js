/**
 * WordPress dependencies
 */
import { Button, __experimentalVStack as VStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { isReusableBlock, isTemplatePart } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import useContentOnlySectionEdit from '../../hooks/use-content-only-section-edit';
import { store as blockEditorStore } from '../../store';

function IsolatedEditButton( {
	block,
	onNavigateToEntityRecord,
	isSyncedPattern,
	isTemplatePartBlock,
} ) {
	const blockAttributes = block?.attributes || {};

	const handleClick = () => {
		if ( isSyncedPattern ) {
			onNavigateToEntityRecord( {
				postId: blockAttributes.ref,
				postType: 'wp_block',
			} );
		} else if ( isTemplatePartBlock ) {
			const { theme, slug } = blockAttributes;
			const templatePartId =
				theme && slug ? `${ theme }//${ slug }` : null;
			if ( templatePartId ) {
				onNavigateToEntityRecord( {
					postId: templatePartId,
					postType: 'wp_template_part',
				} );
			}
		}
	};

	return (
		<VStack className="block-editor-block-inspector-edit-contents" expanded>
			<Button
				className="block-editor-block-inspector-edit-contents__button"
				__next40pxDefaultSize
				variant="secondary"
				onClick={ handleClick }
			>
				{ __( 'Edit original' ) }
			</Button>
		</VStack>
	);
}

function InlineEditButton( {
	clientId,
	editedContentOnlySection,
	editContentOnlySection,
	stopEditingContentOnlySection,
} ) {
	const handleClick = () => {
		if ( ! editedContentOnlySection ) {
			editContentOnlySection( clientId );
		} else {
			stopEditingContentOnlySection();
		}
	};

	return (
		<VStack className="block-editor-block-inspector-edit-contents" expanded>
			<Button
				className="block-editor-block-inspector-edit-contents__button"
				__next40pxDefaultSize
				variant="secondary"
				onClick={ handleClick }
			>
				{ editedContentOnlySection
					? __( 'Exit pattern' )
					: __( 'Edit pattern' ) }
			</Button>
		</VStack>
	);
}

export default function EditContents( { clientId } ) {
	const {
		isWithinSection,
		isWithinEditedSection,
		editedContentOnlySection,
		editContentOnlySection,
		stopEditingContentOnlySection,
	} = useContentOnlySectionEdit( clientId );

	const { block, onNavigateToEntityRecord } = useSelect(
		( select ) => {
			const { getBlock, getSettings } = select( blockEditorStore );
			return {
				block: getBlock( clientId ),
				onNavigateToEntityRecord:
					getSettings().onNavigateToEntityRecord,
			};
		},
		[ clientId ]
	);

	if ( ! isWithinSection && ! isWithinEditedSection ) {
		return null;
	}

	const isSyncedPattern = isReusableBlock( block );
	const isTemplatePartBlock = isTemplatePart( block );
	const shouldUseIsolatedEditor =
		( isSyncedPattern || isTemplatePartBlock ) && onNavigateToEntityRecord;

	if ( shouldUseIsolatedEditor ) {
		return (
			<IsolatedEditButton
				block={ block }
				onNavigateToEntityRecord={ onNavigateToEntityRecord }
				isSyncedPattern={ isSyncedPattern }
				isTemplatePartBlock={ isTemplatePartBlock }
			/>
		);
	}

	return (
		<InlineEditButton
			clientId={ clientId }
			editedContentOnlySection={ editedContentOnlySection }
			editContentOnlySection={ editContentOnlySection }
			stopEditingContentOnlySection={ stopEditingContentOnlySection }
		/>
	);
}
