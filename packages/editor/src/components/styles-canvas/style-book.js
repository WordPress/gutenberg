/**
 * WordPress dependencies
 */
import { useMemo, forwardRef } from '@wordpress/element';
import { useGlobalStylesRevisions } from '@wordpress/global-styles-ui';

/**
 * Internal dependencies
 */
import StyleBook from '../style-book';
import { STYLE_BOOK_COLOR_GROUPS } from '../style-book/constants';
import { useGlobalStyles } from '../global-styles/hooks';

function StyleBookWithNavigation( {
	path,
	onPathChange,
	userConfig,
	forwardedRef,
} ) {
	return (
		<StyleBook
			ref={ forwardedRef }
			path={ path }
			userConfig={ userConfig }
			isSelected={ ( blockName ) =>
				// Match '/blocks/core%2Fbutton' and
				// '/blocks/core%2Fbutton/typography', but not
				// '/blocks/core%2Fbuttons'.
				path === `/blocks/${ encodeURIComponent( blockName ) }` ||
				path?.startsWith(
					`/blocks/${ encodeURIComponent( blockName ) }/`
				)
			}
			onSelect={ ( blockName ) => {
				if (
					STYLE_BOOK_COLOR_GROUPS.find(
						( group ) => group.slug === blockName
					)
				) {
					// Go to color palettes Global Styles.
					onPathChange?.( '/colors/palette' );
					return;
				}
				if ( blockName === 'typography' ) {
					// Go to typography Global Styles.
					onPathChange?.( '/typography' );
					return;
				}

				// Now go to the selected block.
				onPathChange?.( '/blocks/' + encodeURIComponent( blockName ) );
			} }
		/>
	);
}

function StylesCanvasRevisionStyleBook( { path, onPathChange, forwardedRef } ) {
	const { user: userConfig } = useGlobalStyles();
	const { revisions, isLoading } = useGlobalStylesRevisions();

	const revisionId = useMemo( () => {
		const match = path?.match( /^\/revisions\/(.+)$/ );
		return match ? match[ 1 ] : null;
	}, [ path ] );

	const selectedRevision = useMemo( () => {
		if ( ! revisionId || ! revisions.length ) {
			return null;
		}
		return revisions.find(
			( revision ) => String( revision.id ) === String( revisionId )
		);
	}, [ revisionId, revisions ] );

	if ( isLoading ) {
		return null;
	}

	return (
		<StyleBookWithNavigation
			forwardedRef={ forwardedRef }
			path={ path }
			onPathChange={ onPathChange }
			userConfig={ selectedRevision || userConfig }
		/>
	);
}

/**
 * Style Book content component for global styles.
 * Provides the business logic for StyleBook behavior in the global styles context.
 *
 * @param {Object}             props              Component props.
 * @param {string}             props.path         Current path in global styles.
 * @param {Function}           props.onPathChange Callback when the path changes.
 * @param {React.ForwardedRef} ref                Ref to the Style Book component.
 * @return {React.JSX.Element} The Style Book component.
 */
function StylesCanvasStyleBook( { path, onPathChange }, ref ) {
	if ( path?.startsWith( '/revisions' ) ) {
		return (
			<StylesCanvasRevisionStyleBook
				forwardedRef={ ref }
				path={ path }
				onPathChange={ onPathChange }
			/>
		);
	}

	return (
		<StyleBookWithNavigation
			forwardedRef={ ref }
			path={ path }
			onPathChange={ onPathChange }
		/>
	);
}

export default forwardRef( StylesCanvasStyleBook );
