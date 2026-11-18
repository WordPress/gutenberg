import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from '@wordpress/element';
import { Field, Select, SelectControl, VisuallyHidden } from '@wordpress/ui';

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
		const [ font, setFont ] = useState< string | null >( 'serif' );
		const items = options.map( ( option ) => ( {
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
			</>
		);
	},
};

export const SmallSize: Story = {
	render: function Render() {
		const items = [
			{ value: '10', label: '10' },
			{ value: '20', label: '20' },
			{ value: '50', label: '50' },
		];
		const [ perPage, setPerPage ] = useState< string | null >( '20' );

		return (
			<>
				<Field.Root>
					<Field.Label>Items per page</Field.Label>
					<Select.Root
						items={ items }
						value={ perPage }
						onValueChange={ setPerPage }
					>
						<Select.Trigger size="small" />
						<Select.Popup width="content">
							{ items.map( ( item ) => (
								<Select.Item
									key={ item.value }
									value={ item.value }
									size="small"
								>
									<Select.ItemLabel>
										{ item.label }
									</Select.ItemLabel>
								</Select.Item>
							) ) }
						</Select.Popup>
					</Select.Root>
				</Field.Root>
				<p>
					Stored value: <code>{ JSON.stringify( perPage ) }</code>
				</p>
			</>
		);
	},
};
