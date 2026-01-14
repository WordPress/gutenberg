/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	PanelBody,
	Button,
	TextControl,
	SelectControl,
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
 * Text in image policy options.
 */
const TEXT_POLICY_OPTIONS = [
	{ value: '', label: __( 'Select...', 'content-guidelines' ) },
	{
		value: 'never',
		label: __( 'Never include text', 'content-guidelines' ),
	},
	{
		value: 'only_if_requested',
		label: __( 'Only if explicitly requested', 'content-guidelines' ),
	},
	{
		value: 'ok',
		label: __( 'Text is acceptable', 'content-guidelines' ),
	},
];

/**
 * Simple repeater list.
 *
 * @param {Object}   props          Component props.
 * @param {Array}    props.items    List items.
 * @param {Function} props.onChange Change handler.
 * @param {string}   props.label    Add button label.
 * @param {string}   props.placeholder Placeholder text.
 * @return {JSX.Element} Repeater component.
 */
function SimpleRepeater( { items = [], onChange, label, placeholder } ) {
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
							placeholder={ placeholder }
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
 * Images panel.
 *
 * @return {JSX.Element} Panel component.
 */
export default function ImagesPanel() {
	const imageStyle = useSelect(
		( select ) => select( STORE_NAME ).getImageStyle() || {},
		[]
	);

	const { updateDraftSection } = useDispatch( STORE_NAME );

	const handleChange = ( field, value ) => {
		updateDraftSection( 'image_style', { [ field ]: value } );
	};

	return (
		<PanelBody
			title={ __( 'Images', 'content-guidelines' ) }
			initialOpen={ false }
		>
			<div className="content-guidelines-panel-section">
				<h4 className="content-guidelines-panel-section__title">
					{ __( 'Preferred style', 'content-guidelines' ) }
				</h4>
				<p className="content-guidelines-panel-section__description">
					{ __(
						'Describe your ideal image aesthetic.',
						'content-guidelines'
					) }
				</p>
				<SimpleRepeater
					items={ imageStyle.dos || [] }
					onChange={ ( value ) => handleChange( 'dos', value ) }
					label={ __( 'Add style', 'content-guidelines' ) }
					placeholder={ __(
						'e.g., "Clean, minimal, editorial"',
						'content-guidelines'
					) }
				/>
			</div>

			<div className="content-guidelines-panel-section">
				<h4 className="content-guidelines-panel-section__title">
					{ __( 'Avoid in images', 'content-guidelines' ) }
				</h4>
				<SimpleRepeater
					items={ imageStyle.donts || [] }
					onChange={ ( value ) => handleChange( 'donts', value ) }
					label={ __( 'Add rule', 'content-guidelines' ) }
					placeholder={ __(
						'e.g., "No stock photo vibes"',
						'content-guidelines'
					) }
				/>
			</div>

			<SelectControl
				label={ __( 'Text in images', 'content-guidelines' ) }
				help={ __(
					'Should generated images include text?',
					'content-guidelines'
				) }
				value={ imageStyle.text_policy || '' }
				options={ TEXT_POLICY_OPTIONS }
				onChange={ ( value ) => handleChange( 'text_policy', value ) }
			/>
		</PanelBody>
	);
}
