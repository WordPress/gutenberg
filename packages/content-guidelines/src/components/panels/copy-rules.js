/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	PanelBody,
	Button,
	TextControl,
	CheckboxControl,
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
 * Formatting options.
 */
const FORMATTING_OPTIONS = [
	{ value: 'h2s', label: __( 'Use H2 headings', 'content-guidelines' ) },
	{ value: 'bullets', label: __( 'Use bullet points', 'content-guidelines' ) },
	{
		value: 'short_paragraphs',
		label: __( 'Keep paragraphs short', 'content-guidelines' ),
	},
	{
		value: 'single_cta',
		label: __( 'Single CTA at end', 'content-guidelines' ),
	},
];

/**
 * Repeater list component.
 *
 * @param {Object}   props          Component props.
 * @param {Array}    props.items    List items.
 * @param {Function} props.onChange Change handler.
 * @param {string}   props.label    Add button label.
 * @return {JSX.Element} Repeater component.
 */
function RepeaterList( { items = [], onChange, label } ) {
	const handleAdd = () => {
		onChange( [ ...items, '' ] );
	};

	const handleRemove = ( index ) => {
		const newItems = items.filter( ( _, i ) => i !== index );
		onChange( newItems );
	};

	const handleChange = ( index, value ) => {
		const newItems = [ ...items ];
		newItems[ index ] = value;
		onChange( newItems );
	};

	return (
		<div className="content-guidelines-repeater">
			{ items.map( ( item, index ) => (
				<Flex key={ index } gap={ 2 } align="flex-start">
					<FlexBlock>
						<TextControl
							value={ item }
							onChange={ ( value ) => handleChange( index, value ) }
							placeholder={ __( 'Enter rule...', 'content-guidelines' ) }
						/>
					</FlexBlock>
					<FlexItem>
						<Button
							icon={ trash }
							isDestructive
							onClick={ () => handleRemove( index ) }
							label={ __( 'Remove', 'content-guidelines' ) }
						/>
					</FlexItem>
				</Flex>
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
 * Copy Rules panel.
 *
 * @return {JSX.Element} Panel component.
 */
export default function CopyRulesPanel() {
	const copyRules = useSelect(
		( select ) => select( STORE_NAME ).getCopyRules() || {},
		[]
	);

	const { updateDraftSection } = useDispatch( STORE_NAME );

	const handleChange = ( field, value ) => {
		updateDraftSection( 'copy_rules', { [ field ]: value } );
	};

	const handleFormattingChange = ( option, checked ) => {
		const current = copyRules.formatting || [];
		let newFormatting;

		if ( checked ) {
			newFormatting = [ ...current, option ];
		} else {
			newFormatting = current.filter( ( f ) => f !== option );
		}

		handleChange( 'formatting', newFormatting );
	};

	return (
		<PanelBody
			title={ __( 'Copy rules', 'content-guidelines' ) }
			initialOpen={ false }
		>
			<div className="content-guidelines-panel-section">
				<h4 className="content-guidelines-panel-section__title">
					{ __( 'Do', 'content-guidelines' ) }
				</h4>
				<RepeaterList
					items={ copyRules.dos || [] }
					onChange={ ( value ) => handleChange( 'dos', value ) }
					label={ __( 'Add rule', 'content-guidelines' ) }
				/>
			</div>

			<div className="content-guidelines-panel-section">
				<h4 className="content-guidelines-panel-section__title">
					{ __( "Don't", 'content-guidelines' ) }
				</h4>
				<RepeaterList
					items={ copyRules.donts || [] }
					onChange={ ( value ) => handleChange( 'donts', value ) }
					label={ __( 'Add rule', 'content-guidelines' ) }
				/>
			</div>

			<div className="content-guidelines-panel-section">
				<h4 className="content-guidelines-panel-section__title">
					{ __( 'Formatting defaults', 'content-guidelines' ) }
				</h4>
				{ FORMATTING_OPTIONS.map( ( option ) => (
					<CheckboxControl
						key={ option.value }
						label={ option.label }
						checked={ ( copyRules.formatting || [] ).includes(
							option.value
						) }
						onChange={ ( checked ) =>
							handleFormattingChange( option.value, checked )
						}
					/>
				) ) }
			</div>
		</PanelBody>
	);
}
