/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
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
			const query = { per_page: -1, context: 'edit' };
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
				revisionKey: entityConfig?.revisionKey || 'id',
			};
		},
		[]
	);

	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );

	const sortedRevisions = useMemo( () => {
		return (
			revisions
				?.slice()
				.sort( ( a, b ) => new Date( a.date ) - new Date( b.date ) ) ??
			[]
		);
	}, [ revisions ] );

	const selectedIndex = sortedRevisions.findIndex(
		( r ) => r[ revisionKey ] === currentRevisionId
	);

	const handleSliderChange = ( index ) => {
		const revision = sortedRevisions[ index ];
		if ( revision ) {
			setCurrentRevisionId( revision[ revisionKey ] );
		}
	};

	// Format date for tooltip.
	const dateSettings = getDateSettings();
	const renderTooltipContent = ( index ) => {
		const revision = sortedRevisions[ index ];
		if ( ! revision ) {
			return index;
		}
		return dateI18n( dateSettings.formats.datetime, revision.date );
	};

	if ( isLoading ) {
		return <Spinner />;
	}

	if ( ! sortedRevisions.length ) {
		return (
			<span className="editor-revisions-header__no-revisions">
				{ __( 'No revisions found.' ) }
			</span>
		);
	}

	if ( sortedRevisions.length === 1 ) {
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
			max={ sortedRevisions.length - 1 }
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
