/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	PanelBody,
	Button,
	TextControl,
	Flex,
	FlexItem,
	FlexBlock,
} from '@wordpress/components';
import { plus, trash } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../store';

/**
 * Term repeater with optional note.
 *
 * @param {Object}   props          Component props.
 * @param {Array}    props.items    List items.
 * @param {Function} props.onChange Change handler.
 * @param {string}   props.label    Add button label.
 * @return {JSX.Element} Term repeater component.
 */
function TermRepeater( { items = [], onChange, label } ) {
	const handleAdd = () => {
		onChange( [ ...items, { term: '', note: '' } ] );
	};

	const handleRemove = ( index ) => {
		const newItems = items.filter( ( _, i ) => i !== index );
		onChange( newItems );
	};

	const handleChange = ( index, field, value ) => {
		const newItems = [ ...items ];
		newItems[ index ] = {
			...newItems[ index ],
			[ field ]: value,
		};
		onChange( newItems );
	};

	return (
		<div className="content-guidelines-term-repeater">
			{ items.map( ( item, index ) => (
				<div key={ index } className="content-guidelines-term-repeater__item">
					<Flex gap={ 2 } align="flex-start">
						<FlexBlock>
							<TextControl
								label={ __( 'Term', 'content-guidelines' ) }
								value={ item.term || '' }
								onChange={ ( value ) =>
									handleChange( index, 'term', value )
								}
								placeholder={ __(
									'e.g., "readers"',
									'content-guidelines'
								) }
							/>
						</FlexBlock>
						<FlexBlock>
							<TextControl
								label={ __( 'Note (optional)', 'content-guidelines' ) }
								value={ item.note || '' }
								onChange={ ( value ) =>
									handleChange( index, 'note', value )
								}
								placeholder={ __(
									'e.g., "instead of users"',
									'content-guidelines'
								) }
							/>
						</FlexBlock>
						<FlexItem>
							<div style={ { marginTop: '24px' } }>
								<Button
									icon={ trash }
									isDestructive
									onClick={ () => handleRemove( index ) }
									label={ __( 'Remove', 'content-guidelines' ) }
								/>
							</div>
						</FlexItem>
					</Flex>
				</div>
			) ) }

			<Button
				variant="secondary"
				icon={ plus }
				onClick={ handleAdd }
				size="small"
			>
				{ label }
			</Button>
		</div>
	);
}

/**
 * Vocabulary panel.
 *
 * @return {JSX.Element} Panel component.
 */
export default function VocabularyPanel() {
	const vocabulary = useSelect(
		( select ) => select( STORE_NAME ).getVocabulary() || {},
		[]
	);

	const { updateDraftSection } = useDispatch( STORE_NAME );

	const handleChange = ( field, value ) => {
		updateDraftSection( 'vocabulary', { [ field ]: value } );
	};

	return (
		<PanelBody
			title={ __( 'Vocabulary', 'content-guidelines' ) }
			initialOpen={ false }
		>
			<div className="content-guidelines-panel-section">
				<h4 className="content-guidelines-panel-section__title">
					{ __( 'Prefer these terms', 'content-guidelines' ) }
				</h4>
				<p className="content-guidelines-panel-section__description">
					{ __(
						'Terms AI should use. Add a note to explain when or why.',
						'content-guidelines'
					) }
				</p>
				<TermRepeater
					items={ vocabulary.prefer || [] }
					onChange={ ( value ) => handleChange( 'prefer', value ) }
					label={ __( 'Add term', 'content-guidelines' ) }
				/>
			</div>

			<div className="content-guidelines-panel-section">
				<h4 className="content-guidelines-panel-section__title">
					{ __( 'Avoid these terms', 'content-guidelines' ) }
				</h4>
				<p className="content-guidelines-panel-section__description">
					{ __(
						'Terms AI should not use.',
						'content-guidelines'
					) }
				</p>
				<TermRepeater
					items={ vocabulary.avoid || [] }
					onChange={ ( value ) => handleChange( 'avoid', value ) }
					label={ __( 'Add term', 'content-guidelines' ) }
				/>
			</div>
		</PanelBody>
	);
}
