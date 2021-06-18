/**
 * External dependencies
 */
import moment from 'moment';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import ServerSideRender from '@wordpress/server-side-render';
import { useBlockProps } from '@wordpress/block-editor';

const getYearMonth = memoize( ( date ) => {
	if ( ! date ) {
		return {};
	}
	const momentDate = moment( date );
	return {
		year: momentDate.year(),
		month: momentDate.month() + 1,
	};
} );

export default function CalendarEdit( { attributes } ) {
	const date = useSelect( ( select ) => {
		// FIXME: @wordpress/block-library should not depend on @wordpress/editor.
		// Blocks can be loaded into a *non-post* block editor.
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		const editorSelectors = select( 'core/editor' );
		let _date;
		if ( editorSelectors ) {
			const postType = editorSelectors.getEditedPostAttribute( 'type' );
			// Dates are used to overwrite year and month used on the calendar.
			// This overwrite should only happen for 'post' post types.
			// For other post types the calendar always displays the current month.
			if ( postType === 'post' ) {
				_date = editorSelectors.getEditedPostAttribute( 'date' );
			}
		}

		return _date;
	}, [] );

	return (
		<div { ...useBlockProps() }>
			<Disabled>
				<ServerSideRender
					block="core/calendar"
					attributes={ { ...attributes, ...getYearMonth( date ) } }
				/>
			</Disabled>
		</div>
	);
}
