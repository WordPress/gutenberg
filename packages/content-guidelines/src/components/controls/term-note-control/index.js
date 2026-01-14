/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Button,
	TextControl,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { plus, trash } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * TermNoteControl - Renders a list of {term, note} objects with add/remove.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.label         Label for the control.
 * @param {Array}    props.items         Array of {term, note} objects.
 * @param {Function} props.onChange      Callback when items change.
 * @param {string}   props.termPlaceholder   Placeholder for term input.
 * @param {string}   props.notePlaceholder   Placeholder for note input.
 * @return {JSX.Element} TermNoteControl component.
 */
export default function TermNoteControl( {
	label,
	items = [],
	onChange,
	termPlaceholder = __( 'Term', 'content-guidelines' ),
	notePlaceholder = __( 'Why? (optional)', 'content-guidelines' ),
} ) {
	const [ newTerm, setNewTerm ] = useState( '' );
	const [ newNote, setNewNote ] = useState( '' );

	const handleAdd = () => {
		if ( ! newTerm.trim() ) {
			return;
		}
		const newItem = {
			term: newTerm.trim(),
			note: newNote.trim(),
		};
		onChange( [ ...items, newItem ] );
		setNewTerm( '' );
		setNewNote( '' );
	};

	const handleRemove = ( index ) => {
		onChange( items.filter( ( _, i ) => i !== index ) );
	};

	const handleKeyDown = ( e ) => {
		if ( e.key === 'Enter' && newTerm.trim() ) {
			e.preventDefault();
			handleAdd();
		}
	};

	// Handle both object format {term, note} and legacy string format
	const normalizedItems = items.map( ( item ) => {
		if ( typeof item === 'string' ) {
			return { term: item, note: '' };
		}
		return item;
	} );

	return (
		<VStack spacing={ 2 } className="term-note-control">
			{ label && (
				<Text className="term-note-control__label" weight={ 500 }>
					{ label }
				</Text>
			) }

			{ normalizedItems.length > 0 && (
				<ul className="term-note-control__list">
					{ normalizedItems.map( ( item, index ) => (
						<li key={ index } className="term-note-control__item">
							<div className="term-note-control__item-content">
								<span className="term-note-control__term">
									{ item.term }
								</span>
								{ item.note && (
									<span className="term-note-control__note">
										{ item.note }
									</span>
								) }
							</div>
							<Button
								icon={ trash }
								size="small"
								isDestructive
								onClick={ () => handleRemove( index ) }
								label={ __( 'Remove', 'content-guidelines' ) }
							/>
						</li>
					) ) }
				</ul>
			) }

			<div className="term-note-control__add">
				<HStack spacing={ 2 } alignment="bottom">
					<div style={ { flex: 1 } }>
						<TextControl
							__nextHasNoMarginBottom
							placeholder={ termPlaceholder }
							value={ newTerm }
							onChange={ setNewTerm }
							onKeyDown={ handleKeyDown }
						/>
					</div>
					<div style={ { flex: 2 } }>
						<TextControl
							__nextHasNoMarginBottom
							placeholder={ notePlaceholder }
							value={ newNote }
							onChange={ setNewNote }
							onKeyDown={ handleKeyDown }
						/>
					</div>
					<Button
						icon={ plus }
						variant="secondary"
						onClick={ handleAdd }
						disabled={ ! newTerm.trim() }
						label={ __( 'Add', 'content-guidelines' ) }
					/>
				</HStack>
			</div>
		</VStack>
	);
}
