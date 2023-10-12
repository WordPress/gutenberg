/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import CreatePatternModal from './create-pattern-modal';
import { PATTERN_SYNC_TYPES } from '../constants';

export default function DuplicatePatternModal( {
	pattern,
	onClose,
	onSuccess,
} ) {
	const { createSuccessNotice } = useDispatch( noticesStore );
	const categories = useSelect( ( select ) =>
		select( coreStore ).getUserPatternCategories()
	);

	if ( ! pattern ) {
		return null;
	}

	// Until all the different types of patterns are unified, the pattern being
	// duplicated here could be a theme or user-created pattern. The latter
	// is the only type with an ID field.
	const isThemePattern = ! pattern.id;
	const defaultCategories = isThemePattern
		? pattern.categories
		: categories
				?.filter( ( category ) =>
					pattern.wp_pattern_category.includes( category.id )
				)
				.map( ( category ) => category.label );

	const duplicatedProps = {
		defaultCategories,
		content: pattern.content,
		defaultSyncType: isThemePattern
			? PATTERN_SYNC_TYPES.unsynced
			: pattern.wp_pattern_sync_status || PATTERN_SYNC_TYPES.full,
		defaultTitle: sprintf(
			/* translators: %s: Existing pattern title */
			__( '%s (Copy)' ),
			typeof pattern.title === 'string'
				? pattern.title
				: pattern.title.raw
		),
	};

	function handleOnSuccess( { pattern: newPattern } ) {
		createSuccessNotice(
			sprintf(
				// translators: %s: The new pattern's title e.g. 'Call to action (copy)'.
				__( '"%s" duplicated.' ),
				newPattern.title.raw
			),
			{
				type: 'snackbar',
				id: 'patterns-create',
			}
		);

		onSuccess?.( { pattern: newPattern } );
	}

	return (
		<CreatePatternModal
			modalTitle={ __( 'Duplicate pattern' ) }
			confirmLabel={ __( 'Duplicate' ) }
			onClose={ onClose }
			onError={ onClose }
			onSuccess={ handleOnSuccess }
			{ ...duplicatedProps }
		/>
	);
}
