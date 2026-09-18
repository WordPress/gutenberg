import { useSelect, useDispatch } from '@wordpress/data';
import { RangeControl, Spinner, Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useCallback, useMemo, useRef } from '@wordpress/element';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import { useFocusOnMount } from '@wordpress/compose';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function ConnectedRevisionsSlider() {
	const revisionData = useSelect( ( select ) => {
		const {
			getCurrentRevisionId,
			getRevisionPage,
			getPageRevisions,
			getRevisionsPerPage,
		} = unlock( select( editorStore ) );

		const postType = select( editorStore ).getCurrentPostType();
		if ( ! postType ) {
			return {};
		}

		const entityConfig = select( coreStore ).getEntityConfig(
			'postType',
			postType
		);
		const revisionKey = entityConfig?.revisionKey || 'id';
		const revisionPage = getRevisionPage();

		return {
			revisions: getPageRevisions( revisionPage ),
			perPage: getRevisionsPerPage(),
			currentRevisionId: getCurrentRevisionId(),
			revisionKey,
			revisionPage,
			totalRevisions:
				select( editorStore ).getCurrentPostRevisionsCount(),
		};
	}, [] );

	const revisionActions = unlock( useDispatch( editorStore ) );

	return (
		<RevisionsSlider
			{ ...revisionData }
			setCurrentRevisionId={ revisionActions.setCurrentRevisionId }
			setRevisionPage={ revisionActions.setRevisionPage }
		/>
	);
}

/**
 * Slider component for navigating revisions with pagination.
 *
 * @param {Object}          props                      Component props.
 * @param {Array|undefined} props.revisions            Revisions on the current page.
 * @param {number}          props.perPage              Revisions per page.
 * @param {number|string}   props.currentRevisionId    Selected revision ID.
 * @param {string}          props.revisionKey          Revision identifier key.
 * @param {number}          props.revisionPage         Current page.
 * @param {number}          props.totalRevisions       Total number of revisions.
 * @param {Function}        props.setCurrentRevisionId Selects a revision.
 * @param {Function}        props.setRevisionPage      Selects a page.
 * @return {React.JSX.Element} The revisions slider component.
 */
export function RevisionsSlider( {
	revisions: rawRevisions,
	perPage,
	currentRevisionId,
	revisionKey,
	revisionPage,
	totalRevisions,
	setCurrentRevisionId,
	setRevisionPage,
} ) {
	const setFocusOnMountRef = useFocusOnMount( true );
	const initialActiveElementRef = useRef();
	const loadingRef = useCallback( ( node ) => {
		if ( node && initialActiveElementRef.current === undefined ) {
			initialActiveElementRef.current = node.ownerDocument.activeElement;
		}
	}, [] );

	const focusOnMountRef = useCallback(
		( node ) => {
			if ( ! node ) {
				setFocusOnMountRef( null );
				return;
			}

			const { activeElement, body, documentElement } = node.ownerDocument;
			const initialActiveElement =
				initialActiveElementRef.current ?? activeElement;
			const focusHasNotMoved =
				activeElement === initialActiveElement ||
				activeElement === body ||
				activeElement === documentElement;

			// If the user moves focus while revisions load, keep it there when the
			// slider mounts.
			if ( focusHasNotMoved ) {
				setFocusOnMountRef( node );
			}
		},
		[ setFocusOnMountRef ]
	);

	const isLoading = ! rawRevisions;
	const totalPages = Math.ceil( totalRevisions / perPage ) || 1;

	// Reverse desc→asc so the slider reads oldest (left) → newest (right).
	const revisions = useMemo(
		() => rawRevisions && [ ...rawRevisions ].reverse(),
		[ rawRevisions ]
	);

	const selectedIndex = revisions?.findIndex(
		( r ) => r[ revisionKey ] === currentRevisionId
	);

	const handleSliderChange = ( index ) => {
		const revision = revisions?.[ index ];
		if ( revision ) {
			setCurrentRevisionId( revision[ revisionKey ] );
		}
	};

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
		return <Spinner ref={ loadingRef } />;
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

	const getPageRangeLabel = ( page ) => {
		const end = totalRevisions - ( page - 1 ) * perPage;
		const start = Math.max( 1, end - perPage + 1 );
		return sprintf(
			/* translators: 1: first revision number, 2: last revision number */
			__( 'Revisions %1$s–%2$s' ),
			start,
			end
		);
	};

	const sliderOrSpinner =
		isLoading || selectedIndex === -1 ? (
			<Spinner ref={ loadingRef } />
		) : (
			<RangeControl
				ref={ focusOnMountRef }
				aria-valuetext={ renderTooltipContent( selectedIndex ) }
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

	if ( ! showPagination ) {
		return sliderOrSpinner;
	}

	return (
		<Stack direction="row" gap="sm" align="center" style={ { flex: 1 } }>
			<Button
				icon={ chevronLeft }
				label={
					revisionPage < totalPages
						? getPageRangeLabel( revisionPage + 1 )
						: __( 'No older revisions' )
				}
				onClick={ () => setRevisionPage( revisionPage + 1 ) }
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
						: __( 'No newer revisions' )
				}
				onClick={ () => setRevisionPage( revisionPage - 1 ) }
				disabled={ isLoading || revisionPage <= 1 }
				size="compact"
				accessibleWhenDisabled
			/>
		</Stack>
	);
}
