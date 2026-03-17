/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, _x, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import CreatePatternModal from './create-pattern-modal';
import { PATTERN_SYNC_TYPES, PATTERN_TYPES } from '../constants';

function getTermLabels( pattern, categories ) {
	// Theme patterns rely on core pattern categories.
	if ( pattern.type !== PATTERN_TYPES.user ) {
		return categories.core
			?.filter( ( category ) =>
				pattern.categories?.includes( category.name )
			)
			.map( ( category ) => category.label );
	}

	return categories.user
		?.filter( ( category ) =>
			pattern.wp_pattern_category?.includes( category.id )
		)
		.map( ( category ) => category.label );
}

export function useDuplicatePatternProps( { pattern, onSuccess } ) {
	const { createSuccessNotice } = useDispatch( noticesStore );
	const categories = useSelect( ( select ) => {
		const { getUserPatternCategories, getBlockPatternCategories } =
			select( coreStore );

		return {
			core: getBlockPatternCategories(),
			user: getUserPatternCategories(),
		};
	} );
	if ( ! pattern ) {
		return null;
	}
	return {
		content: pattern.content,
		defaultCategories: getTermLabels( pattern, categories ),
		defaultSyncType:
			pattern.type !== PATTERN_TYPES.user // Theme patterns are unsynced by default.
				? PATTERN_SYNC_TYPES.unsynced
				: pattern.wp_pattern_sync_status || PATTERN_SYNC_TYPES.full,
		defaultTitle: sprintf(
			/* translators: %s: Existing pattern title */
			_x( '%s (Copy)', 'pattern' ),
			typeof pattern.title === 'string'
				? pattern.title
				: pattern.title.raw
		),
		onSuccess: ( { pattern: newPattern } ) => {
			createSuccessNotice(
				sprintf(
					// translators: %s: The new pattern's title e.g. 'Call to action (copy)'.
					_x( '"%s" duplicated.', 'pattern' ),
					newPattern.title.raw
				),
				{
					type: 'snackbar',
					id: 'patterns-create',
				}
			);

			onSuccess?.( { pattern: newPattern } );
		},
	};
}

export default function DuplicatePatternModal( {
	pattern,
	onClose,
	onSuccess,
} ) {
	const duplicatedProps = useDuplicatePatternProps( { pattern, onSuccess } );
	if ( ! pattern ) {
		return null;
	}
	return (
		<CreatePatternModal
			modalTitle={ __( 'Duplicate pattern' ) }
			confirmLabel={ __( 'Duplicate' ) }
			onClose={ onClose }
			onError={ onClose }
			{ ...duplicatedProps }
		/>
	);
}
