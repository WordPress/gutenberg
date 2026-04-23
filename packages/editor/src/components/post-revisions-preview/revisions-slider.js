/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { RangeControl, Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Slider component for navigating revisions.
 *
 * @return {React.JSX.Element} The revisions slider component.
 */
function RevisionsSlider() {
	const { revisions, isLoading, currentRevisionId, revisionKey } = useSelect(
		( select ) => {
			const { getCurrentPostId, getCurrentPostType } =
				select( editorStore );
			const { getRevisions, isResolving, getEntityConfig } =
				select( coreStore );

			const postId = getCurrentPostId();
			const postType = getCurrentPostType();

			if ( ! postId || ! postType ) {
				return {};
			}

			const entityConfig = getEntityConfig( 'postType', postType );
			const _revisionKey = entityConfig?.revisionKey || 'id';
			const query = {
				per_page: -1,
				context: 'edit',
				orderby: 'date',
				order: 'asc',
				_fields: [
					...new Set( [
						'id',
						'date',
						'modified',
						'author',
						'meta',
						'title.raw',
						'excerpt.raw',
						'content.raw',
						_revisionKey,
					] ),
				].join(),
			};
			return {
				revisions: getRevisions( 'postType', postType, postId, query ),
				isLoading: isResolving( 'getRevisions', [
					'postType',
					postType,
					postId,
					query,
				] ),
				currentRevisionId: unlock(
					select( editorStore )
				).getCurrentRevisionId(),
				revisionKey: _revisionKey,
			};
		},
		[]
	);

	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );

	const selectedIndex = revisions?.findIndex(
		( r ) => r[ revisionKey ] === currentRevisionId
	);

	const handleSliderChange = ( index ) => {
		const revision = revisions?.[ index ];
		if ( revision ) {
			setCurrentRevisionId( revision[ revisionKey ] );
		}
	};

	// Format date for tooltip.
	const dateSettings = getDateSettings();
	const renderTooltipContent = ( index ) => {
		const revision = revisions?.[ index ];
		if ( ! revision ) {
			return index;
		}
		return dateI18n( dateSettings.formats.datetime, revision.date );
	};

	if ( isLoading ) {
		return <Spinner />;
	}

	if ( ! revisions?.length ) {
		return (
			<span className="editor-revisions-header__no-revisions">
				{ __( 'No revisions found.' ) }
			</span>
		);
	}

	if ( revisions?.length === 1 ) {
		return (
			<span className="editor-revisions-header__no-revisions">
				{ __( 'Only one revision found.' ) }
			</span>
		);
	}

	return (
		<RangeControl
			__next40pxDefaultSize
			className="editor-revisions-header__slider"
			hideLabelFromVision
			label={ __( 'Revision' ) }
			max={ revisions?.length - 1 }
			min={ 0 }
			marks
			onChange={ handleSliderChange }
			renderTooltipContent={ renderTooltipContent }
			value={ selectedIndex }
			withInputField={ false }
		/>
	);
}

export default RevisionsSlider;
