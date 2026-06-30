/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { dateI18n, getSettings } from '@wordpress/date';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PostCardPanel from '../post-card-panel';
import PostPanelRow from '../post-panel-row';
import PostPanelSection from '../post-panel-section';

const STATUS_LABELS = {
	publish: __( 'Published' ),
	draft: __( 'Draft' ),
	'auto-draft': __( 'Draft' ),
	pending: __( 'Pending' ),
	private: __( 'Private' ),
	future: __( 'Scheduled' ),
};

export default function InlineTemplatePartSummary( {
	activeEntity,
	onActionPerformed,
} ) {
	const { postType, postId } = activeEntity;
	const { record, areaLabel, themeName } = useSelect(
		( select ) => {
			const core = select( coreStore );
			const currentTheme = core.getCurrentTheme();
			const entityRecord = core.getEditedEntityRecord(
				'postType',
				postType,
				postId
			);
			const area = currentTheme?.default_template_part_areas?.find(
				( item ) => item.area === entityRecord?.area
			);

			return {
				record: entityRecord,
				areaLabel:
					area?.label ||
					area?.title ||
					entityRecord?.area ||
					undefined,
				themeName:
					currentTheme?.name?.rendered ||
					currentTheme?.name ||
					entityRecord?.theme,
			};
		},
		[ postType, postId ]
	);

	if ( ! record ) {
		return null;
	}

	const statusLabel =
		STATUS_LABELS[ record.status ] || record.status || __( 'Unknown' );
	const modified = record.modified
		? dateI18n( getSettings().formats.datetimeAbbreviated, record.modified )
		: null;

	return (
		<PostPanelSection className="editor-post-summary">
			<PostCardPanel
				postType={ postType }
				postId={ postId }
				onActionPerformed={ onActionPerformed }
			/>
			<div>
				<PostPanelRow label={ __( 'Status' ) }>
					<span>{ statusLabel }</span>
				</PostPanelRow>
				{ areaLabel && (
					<PostPanelRow label={ __( 'Area' ) }>
						<span>{ areaLabel }</span>
					</PostPanelRow>
				) }
				{ record.slug && (
					<PostPanelRow label={ __( 'Slug' ) }>
						<span>{ record.slug }</span>
					</PostPanelRow>
				) }
				{ themeName && (
					<PostPanelRow label={ __( 'Theme' ) }>
						<span>{ themeName }</span>
					</PostPanelRow>
				) }
				{ modified && (
					<PostPanelRow label={ __( 'Modified' ) }>
						<span>{ modified }</span>
					</PostPanelRow>
				) }
			</div>
		</PostPanelSection>
	);
}
