import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { SelectControl } from '@wordpress/ui';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useMemo } from '@wordpress/element';
import { store as editorStore } from '../../store';
import { TEMPLATE_POST_TYPE } from '../../store/constants';

// No parent is stored as an empty string, but the select treats an empty
// value as no selection and shows its placeholder.
const NO_PARENT_VALUE = '//none';

type TemplateRecord = {
	slug?: string;
	parent_template?: string;
	title?: { rendered?: string } | string;
};

type Option = { value: string; label: string };

function getTemplateTitle( template: TemplateRecord ): string {
	const title =
		typeof template.title === 'string'
			? template.title
			: template.title?.rendered;
	return decodeEntities( title ?? '' ) || template.slug || '';
}

function TemplateParentPanelInner( { postId }: { postId: string } ) {
	const { slug, parentSlug, templates } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, getEntityRecords } =
				select( coreStore );
			const record = getEditedEntityRecord(
				'postType',
				TEMPLATE_POST_TYPE,
				postId
			) as TemplateRecord | undefined;
			return {
				slug: record?.slug,
				parentSlug: record?.parent_template ?? '',
				templates: getEntityRecords( 'postType', TEMPLATE_POST_TYPE, {
					per_page: -1,
				} ) as TemplateRecord[] | null,
			};
		},
		[ postId ]
	);

	const options = useMemo< Option[] >(
		() => [
			{ value: NO_PARENT_VALUE, label: __( 'None' ) },
			...( templates ?? [] )
				.filter( ( template ) => !! template.slug )
				.filter( ( template ) => template.slug !== slug )
				.map( ( template ) => ( {
					value: template.slug as string,
					label: getTemplateTitle( template ),
				} ) ),
		],
		[ templates, slug ]
	);

	const selectedOption =
		options.find( ( option ) => option.value === parentSlug ) ??
		options[ 0 ];

	const { editEntityRecord } = useDispatch( coreStore );

	return (
		<PanelBody title={ __( 'Parent template' ) }>
			<SelectControl
				label={ __( 'Parent template' ) }
				hideLabelFromVision
				value={ selectedOption }
				items={ options }
				onValueChange={ ( item ) =>
					editEntityRecord( 'postType', TEMPLATE_POST_TYPE, postId, {
						parent_template:
							! item?.value || item.value === NO_PARENT_VALUE
								? ''
								: item.value,
					} )
				}
			/>
			<p>
				{ __(
					'This template shows inside the parent template, in place of its Content block.'
				) }
			</p>
		</PanelBody>
	);
}

/**
 * Lets a template pick the template it renders inside, for the template
 * inheritance experiment. Callers render it only while the experiment is on.
 */
export default function TemplateParentPanel() {
	const { postType, postId } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		return {
			postType: getCurrentPostType() as string | undefined,
			postId: getCurrentPostId() as string | undefined,
		};
	}, [] );

	if ( postType !== TEMPLATE_POST_TYPE || ! postId ) {
		return null;
	}

	return <TemplateParentPanelInner postId={ postId } />;
}
