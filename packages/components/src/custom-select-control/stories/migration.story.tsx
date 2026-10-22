import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from '@wordpress/element';
import { SelectControl, VisuallyHidden } from '@wordpress/ui';

const meta: Meta< typeof SelectControl > = {
	title: 'Components/@wordpress-components/Selection & Input/Common/CustomSelectControl/Migration examples',
	id: 'components-customselectcontrol-migration-examples',
	component: SelectControl,
	tags: [ 'docs-only' ],
};

export default meta;
type Story = StoryObj< typeof SelectControl >;

export const StoredValue: Story = {
	render: function Render() {
		const items = [
			{
				value: 'thumbnail',
				label: 'Thumbnail',
				description: '150 × 150',
			},
			{ value: 'medium', label: 'Medium', description: '300 × 300' },
			{
				value: 'full',
				label: 'Full size',
				description: 'Original dimensions',
			},
		];
		const [ imageSize, setImageSize ] = useState< string | null >(
			'medium'
		);
		const selectedItem =
			items.find( ( item ) => item.value === imageSize ) ?? null;

		return (
			<>
				<SelectControl
					label="Image size"
					items={ items }
					value={ selectedItem }
					onValueChange={ ( item ) =>
						setImageSize( item?.value ?? null )
					}
				/>
				<p>
					Stored value: <code>{ JSON.stringify( imageSize ) }</code>
				</p>
			</>
		);
	},
};

export const SelectedHints: Story = {
	render: function Render() {
		const options = [
			{
				key: 'serif',
				name: 'Serif',
				hint: 'Traditional',
				style: { fontFamily: 'serif' },
				className: 'font-preview',
			},
			{
				key: 'sans-serif',
				name: 'Sans serif',
				hint: 'Modern',
				style: { fontFamily: 'sans-serif' },
				className: 'font-preview',
			},
		];
		const [ hasOptions, setHasOptions ] = useState( true );
		const [ font, setFont ] = useState< string | null >( 'serif' );
		const customOptions = hasOptions ? options : [];
		const items = customOptions.map( ( option ) => ( {
			value: option.key,
			label: option.name,
			description: option.hint,
			style: option.style,
			className: option.className,
		} ) );
		const selectedItem =
			items.find( ( item ) => item.value === font ) ?? null;
		const selectedHint = selectedItem?.description;
		const descriptionId = useId();
		const describedBy = 'Choose a font for the heading.';
		const description = [ selectedHint, describedBy ]
			.filter( Boolean )
			.join( ' ' );

		return (
			<>
				<SelectControl
					label="Font"
					items={ items }
					value={ selectedItem }
					onValueChange={ ( item ) => {
						if ( item ) {
							setFont( item.value );
						}
					} }
					disabled={ items.length === 0 }
					placeholder="Choose a font"
					trigger={
						<SelectControl.Trigger
							aria-describedby={ descriptionId }
						>
							{ selectedItem ? (
								<>
									{ selectedItem.label }
									{ selectedHint && (
										<span aria-hidden="true">
											{ ' ' }
											({ selectedHint })
										</span>
									) }
								</>
							) : undefined }
						</SelectControl.Trigger>
					}
				>
					{ items.map( ( item ) => (
						<SelectControl.Item
							key={ item.value }
							value={ item }
							label={ item.label }
							className={ item.className }
						>
							<SelectControl.ItemLabel style={ item.style }>
								{ item.label }
							</SelectControl.ItemLabel>
							<SelectControl.ItemDescription>
								{ item.description }
							</SelectControl.ItemDescription>
						</SelectControl.Item>
					) ) }
				</SelectControl>
				<VisuallyHidden id={ descriptionId }>
					{ description }
				</VisuallyHidden>
				<p>
					Stored value: <code>{ JSON.stringify( font ) }</code>
				</p>
				<button
					type="button"
					onClick={ () => setHasOptions( ! hasOptions ) }
				>
					{ hasOptions
						? 'Use empty custom options'
						: 'Restore options' }
				</button>
			</>
		);
	},
};

export const EmptyStringChoice: Story = {
	render: function Render() {
		const items = [
			{ value: null, label: 'Clear selection' },
			{ value: '', label: 'Use theme font' },
			{ value: 'serif', label: 'Serif' },
		];
		const [ font, setFont ] = useState< string | null >( null );
		const [ submitted, setSubmitted ] = useState( '' );
		const selectedItem =
			items.find( ( item ) => item.value === font ) ?? null;

		return (
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();
					setSubmitted(
						JSON.stringify(
							new FormData( event.currentTarget ).get( 'font' )
						)
					);
				} }
			>
				<SelectControl
					label="Font preference"
					name="font"
					required
					items={ items }
					value={ selectedItem }
					onValueChange={ ( item ) => setFont( item?.value ?? null ) }
					itemToStringValue={ ( item ) =>
						item.value === null ? '' : `font:${ item.value }`
					}
				/>
				<p>
					Stored value: <code>{ JSON.stringify( font ) }</code>
				</p>
				<button type="submit">Submit preference</button>
				<p>
					Submitted font:{ ' ' }
					<code>{ submitted || 'Not submitted' }</code>
				</p>
			</form>
		);
	},
};
