/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	RangeControl,
	Spinner,
	Button,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useEffect, useMemo } from '@wordpress/element';
import { chevronLeft, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const REVISIONS_PER_PAGE = 100;

/**
 * Slider component for navigating revisions with pagination.
 *
 * Page 1 contains the newest revisions. The API returns them in
 * descending date order, and we reverse for display so the slider
 * reads oldest-left → newest-right.
 *
 * @return {React.JSX.Element} The revisions slider component.
 */
function RevisionsSlider() {
	const {
		revisions: rawRevisions,
		isLoading,
		currentRevisionId,
		revisionKey,
		revisionPage,
		totalRevisions,
	} = useSelect( ( select ) => {
		const {
			getCurrentPostId,
			getCurrentPostType,
			getCurrentPostRevisionsCount,
		} = select( editorStore );
		const { getRevisions, isResolving, getEntityConfig } =
			select( coreStore );
		const { getCurrentRevisionId, getRevisionPage } = unlock(
			select( editorStore )
		);

		const postId = getCurrentPostId();
		const postType = getCurrentPostType();

		if ( ! postId || ! postType ) {
			return {};
		}

		const entityConfig = getEntityConfig( 'postType', postType );
		const _revisionKey = entityConfig?.revisionKey || 'id';
		const _totalRevisions = getCurrentPostRevisionsCount();
		const _revisionPage = getRevisionPage();

		// Don't fetch until we have a page number.
		if ( ! _revisionPage ) {
			return {
				isLoading: true,
				totalRevisions: _totalRevisions,
				revisionPage: _revisionPage,
				revisionKey: _revisionKey,
			};
		}

		const query = {
			per_page: REVISIONS_PER_PAGE,
			page: _revisionPage,
			context: 'edit',
			orderby: 'date',
			order: 'desc',
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
			currentRevisionId: getCurrentRevisionId(),
			revisionKey: _revisionKey,
			revisionPage: _revisionPage,
			totalRevisions: _totalRevisions,
		};
	}, [] );

	const { setCurrentRevisionId, setRevisionPage } = unlock(
		useDispatch( editorStore )
	);

	const totalPages = Math.ceil( totalRevisions / REVISIONS_PER_PAGE ) || 1;

	// Reverse so the slider reads oldest (left) → newest (right).
	const revisions = useMemo(
		() => rawRevisions && [ ...rawRevisions ].reverse(),
		[ rawRevisions ]
	);

	// Set initial page to 1 (newest revisions) when entering revisions mode.
	useEffect( () => {
		if ( revisionPage === null && totalRevisions > 0 ) {
			setRevisionPage( 1 );
		}
	}, [ revisionPage, totalRevisions, setRevisionPage ] );

	const selectedIndex = revisions?.findIndex(
		( r ) => r[ revisionKey ] === currentRevisionId
	);

	const handleSliderChange = ( index ) => {
		const revision = revisions?.[ index ];
		if ( revision ) {
			setCurrentRevisionId( revision[ revisionKey ] );
		}
	};

	const handlePageChange = ( newPage ) => {
		setRevisionPage( newPage );
	};

	// When revisions load and no revision is selected (after page change),
	// select the last revision on the page (newest = last in reversed array).
	useEffect( () => {
		if ( revisions?.length && selectedIndex === -1 ) {
			const lastRevision = revisions[ revisions.length - 1 ];
			setCurrentRevisionId( lastRevision[ revisionKey ] );
		}
	}, [ revisions, selectedIndex, revisionKey, setCurrentRevisionId ] );

	// Format date for tooltip.
	const dateSettings = getDateSettings();
	const renderTooltipContent = ( index ) => {
		const revision = revisions?.[ index ];
		if ( ! revision ) {
			return index;
		}
		return dateI18n( dateSettings.formats.datetime, revision.date );
	};

	const showPagination = totalPages > 1;

	if ( isLoading && ! showPagination ) {
		return <Spinner />;
	}

	if ( ! isLoading && ! revisions?.length ) {
		return (
			<span className="editor-revisions-header__no-revisions">
				{ __( 'No revisions found.' ) }
			</span>
		);
	}

	if ( totalRevisions <= 1 ) {
		return (
			<span className="editor-revisions-header__no-revisions">
				{ __( 'Only one revision found.' ) }
			</span>
		);
	}

	// Compute the 1-based revision range for a given page.
	// Page 1 = newest, so page 1 of 1000 → "901–1000".
	const getPageRangeLabel = ( page ) => {
		const end = totalRevisions - ( page - 1 ) * REVISIONS_PER_PAGE;
		const start = Math.max( 1, end - REVISIONS_PER_PAGE + 1 );
		return sprintf(
			/* translators: 1: first revision number, 2: last revision number */
			__( 'Revisions %1$s\u2013%2$s' ),
			start,
			end
		);
	};

	const sliderOrSpinner = isLoading ? (
		<Spinner />
	) : (
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
			value={ selectedIndex >= 0 ? selectedIndex : 0 }
			withInputField={ false }
		/>
	);

	if ( ! showPagination ) {
		return sliderOrSpinner;
	}

	return (
		<HStack spacing={ 2 } expanded wrap={ false }>
			<Button
				icon={ chevronLeft }
				label={
					revisionPage < totalPages
						? getPageRangeLabel( revisionPage + 1 )
						: __( 'Older revisions' )
				}
				onClick={ () => handlePageChange( revisionPage + 1 ) }
				disabled={ isLoading || revisionPage >= totalPages }
				size="compact"
				accessibleWhenDisabled
			/>
			<div
				style={ {
					flex: 1,
					minWidth: 0,
					display: 'flex',
					justifyContent: 'center',
				} }
			>
				{ sliderOrSpinner }
			</div>
			<Button
				icon={ chevronRight }
				label={
					revisionPage > 1
						? getPageRangeLabel( revisionPage - 1 )
						: __( 'Newer revisions' )
				}
				onClick={ () => handlePageChange( revisionPage - 1 ) }
				disabled={ isLoading || revisionPage <= 1 }
				size="compact"
				accessibleWhenDisabled
			/>
		</HStack>
	);
}

export { REVISIONS_PER_PAGE };
export default RevisionsSlider;
