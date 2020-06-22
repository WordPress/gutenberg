/**
 * External dependencies
 */
import { some, groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { close as closeIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import EntityTypeList from './entity-type-list';

const ENTITY_NAMES = {
	wp_template_part: ( number ) =>
		_n( 'template part', 'template parts', number ),
	wp_template: ( number ) => _n( 'template', 'templates', number ),
	post: ( number ) => _n( 'post', 'posts', number ),
	page: ( number ) => _n( 'page', 'pages', number ),
	site: ( number ) => _n( 'site', 'sites', number ),
};

const PLACEHOLDER_PHRASES = {
	// 0 is a back up, but should never be observed.
	0: __( 'There are no changes.' ),
	/* translators: placeholders represent pre-translated singular/plural entity names (page, post, template, site, etc.) */
	1: __( 'Changes have been made to your %s.' ),
	/* translators: placeholders represent pre-translated singular/plural entity names (page, post, template, site, etc.) */
	2: __( 'Changes have been made to your %1$s and %2$s.' ),
	/* translators: placeholders represent pre-translated singular/plural entity names (page, post, template, site, etc.) */
	3: __( 'Changes have been made to your %1$s, %2$s, and %3$s.' ),
	/* translators: placeholders represent pre-translated singular/plural entity names (page, post, template, site, etc.) */
	4: __( 'Changes have been made to your %1$s, %2$s, %3$s, and %4$s.' ),
	/* translators: placeholders represent pre-translated singular/plural entity names (page, post, template, site, etc.) */
	5: __( 'Changes have been made to your %1$s, %2$s, %3$s, %4$s, and %5$s.' ),
};

export default function EntitiesSavedStates( { isOpen, close } ) {
	const { dirtyEntityRecords } = useSelect( ( select ) => {
		return {
			dirtyEntityRecords: select(
				'core'
			).__experimentalGetDirtyEntityRecords(),
		};
	}, [] );
	const { saveEditedEntityRecord } = useDispatch( 'core' );

	// To group entities by type.
	const partitionedSavables = Object.values(
		groupBy( dirtyEntityRecords, 'name' )
	);

	// Get labels for text-prompt phrase.
	const entityNamesForPrompt = [];
	partitionedSavables.forEach( ( list ) => {
		if ( ENTITY_NAMES[ list[ 0 ].name ] ) {
			entityNamesForPrompt.push(
				ENTITY_NAMES[ list[ 0 ].name ]( list.length )
			);
		}
	} );
	// Get text-prompt phrase based on number of entity types changed.
	const placeholderPhrase =
		PLACEHOLDER_PHRASES[ entityNamesForPrompt.length ] ||
		// Fallback for edge case that should not be observed (more than 5 entity types edited).
		__( 'Changes have been made to multiple entity types.' );
	// eslint-disable-next-line @wordpress/valid-sprintf
	const promptPhrase = sprintf( placeholderPhrase, ...entityNamesForPrompt );

	// Unchecked entities to be ignored by save function.
	const [ unselectedEntities, _setUnselectedEntities ] = useState( [] );

	const setUnselectedEntities = ( { kind, name, key }, checked ) => {
		if ( checked ) {
			_setUnselectedEntities(
				unselectedEntities.filter(
					( elt ) =>
						elt.kind !== kind ||
						elt.name !== name ||
						elt.key !== key
				)
			);
		} else {
			_setUnselectedEntities( [
				...unselectedEntities,
				{ kind, name, key },
			] );
		}
	};

	const saveCheckedEntities = () => {
		const entitiesToSave = dirtyEntityRecords.filter(
			( { kind, name, key } ) => {
				return ! some(
					unselectedEntities,
					( elt ) =>
						elt.kind === kind &&
						elt.name === name &&
						elt.key === key
				);
			}
		);

		close( entitiesToSave );

		entitiesToSave.forEach( ( { kind, name, key } ) => {
			saveEditedEntityRecord( kind, name, key );
		} );
	};

	const [ isReviewing, setIsReviewing ] = useState( false );
	const toggleIsReviewing = () => setIsReviewing( ( value ) => ! value );

	// Explicitly define this with no argument passed.  Using `close` on
	// its own will use the event object in place of the expected saved entities.
	const dismissPanel = useCallback( () => close(), [ close ] );

	return isOpen ? (
		<div className="entities-saved-states__panel">
			<div className="entities-saved-states__panel-header">
				<Button
					isPrimary
					disabled={
						dirtyEntityRecords.length -
							unselectedEntities.length ===
						0
					}
					onClick={ saveCheckedEntities }
					className="editor-entities-saved-states__save-button"
				>
					{ __( 'Save' ) }
				</Button>
				<Button
					onClick={ dismissPanel }
					icon={ closeIcon }
					label={ __( 'Close panel' ) }
				/>
			</div>

			<div className="entities-saved-states__text-prompt">
				<strong>{ __( 'Are you ready to save?' ) }</strong>
				<p>{ promptPhrase }</p>
				<p>
					<Button
						onClick={ toggleIsReviewing }
						isLink
						className="entities-saved-states__review-changes-button"
					>
						{ isReviewing
							? __( 'Hide changes.' )
							: __( 'Review changes.' ) }
					</Button>
				</p>
			</div>

			{ isReviewing &&
				partitionedSavables.map( ( list ) => {
					return (
						<EntityTypeList
							key={ list[ 0 ].name }
							list={ list }
							closePanel={ dismissPanel }
							unselectedEntities={ unselectedEntities }
							setUnselectedEntities={ setUnselectedEntities }
						/>
					);
				} ) }
		</div>
	) : null;
}
