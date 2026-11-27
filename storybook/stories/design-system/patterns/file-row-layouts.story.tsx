/**
 * Temporary stories to compare layouts for file rows with long names. Each
 * story shows the same rows in a wide and a narrow field. Remove this file
 * and the `layout` prop once a layout is chosen.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { closeSmall, plus } from '@wordpress/icons';
import {
	Badge,
	Button,
	Fieldset,
	Icon,
	IconButton,
	Progress,
	Stack,
	Text,
} from '@wordpress/ui';
import { FileSummary, SelectedFile } from './selected-file';
import type { FileRowLayout } from './selected-file';
import styles from './file-picker.module.css';

const LANDSCAPE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="#8fb3d9"/><circle cx="16" cy="8" r="3" fill="#f5d76e"/><path d="M0 18 8 11l6 5 4-3 6 5v6H0z" fill="#4f7a5a"/></svg>`;

/**
 * Returns a stand-in file. An image gets an SVG body, so its thumbnail shows,
 * and the size is set to look like a real photo or document.
 *
 * @param name  The filename.
 * @param size  The size to show, in bytes.
 * @param image Whether the file is an image.
 */
function createFile( name: string, size: number, image = false ) {
	const file = image
		? new File( [ LANDSCAPE ], name, { type: 'image/svg+xml' } )
		: new File( [ '' ], name, { type: 'application/pdf' } );
	Object.defineProperty( file, 'size', { value: size } );
	return file;
}

const SHORT_IMAGE = createFile( 'waves.png', 400_000, true );
const LONG_IMAGE = createFile(
	'quarterly-planning-presentation-final-version-with-speaker-notes.png',
	826_000,
	true
);
const SHORT_PDF = createFile( 'invoice-2026-11.pdf', 158_000 );
const LONG_PDF = createFile(
	'insurance-claim-water-damage-kitchen-ceiling-2026.pdf',
	1_240_000
);

const noop = () => {};

function AddButton( { label }: { label: string } ) {
	return (
		<Stack direction="row" className={ styles.surface }>
			<Button variant="unstyled" className={ styles.choose }>
				<Stack
					render={ <span /> }
					direction="row"
					align="center"
					gap="sm"
				>
					<span className={ styles.thumbnail }>
						<Icon icon={ plus } />
					</span>
					<Text className={ styles.prompt }>{ label }</Text>
				</Stack>
			</Button>
		</Stack>
	);
}

/** The single-file drop area with a chosen file, as in the drop area example. */
function ChosenFile( { file, layout }: { file: File; layout: FileRowLayout } ) {
	return (
		<Stack
			direction="row"
			align={ layout === 'wrap' ? 'center' : 'flex-start' }
			gap="sm"
			className={ styles.surface }
		>
			<Button variant="unstyled" className={ styles.choose }>
				<FileSummary file={ file } layout={ layout } />
			</Button>
			<IconButton
				className={ styles.remove }
				icon={ closeSmall }
				label={ `Remove ${ file.name }` }
				variant="minimal"
				tone="neutral"
				size="small"
			/>
		</Stack>
	);
}

function List( { children }: { children: React.ReactNode } ) {
	return (
		<Stack
			render={ <ul /> }
			role="list"
			direction="column"
			gap="sm"
			className={ styles.list }
		>
			{ children }
		</Stack>
	);
}

function Field( { layout, width }: { layout: FileRowLayout; width: number } ) {
	return (
		<Stack direction="column" gap="xl" style={ { inlineSize: width } }>
			<Text variant="heading-sm">{ `${ width }px` }</Text>
			<Fieldset.Root>
				<Fieldset.Legend>Cover image</Fieldset.Legend>
				<Stack direction="column" gap="sm">
					<AddButton label="Add an image" />
					<ChosenFile file={ SHORT_IMAGE } layout={ layout } />
					<ChosenFile file={ LONG_IMAGE } layout={ layout } />
				</Stack>
			</Fieldset.Root>
			<Fieldset.Root>
				<Fieldset.Legend>Supporting documents</Fieldset.Legend>
				<Stack direction="column" gap="sm">
					<List>
						{ [ SHORT_IMAGE, LONG_IMAGE, SHORT_PDF ].map(
							( file ) => (
								<li key={ file.name }>
									<SelectedFile
										file={ file }
										layout={ layout }
										onRemove={ noop }
									/>
								</li>
							)
						) }
					</List>
					<AddButton label="Add more files" />
				</Stack>
			</Fieldset.Root>
			<Fieldset.Root>
				<Fieldset.Legend>Photos of the damage</Fieldset.Legend>
				<List>
					<li>
						<SelectedFile
							file={ SHORT_IMAGE }
							layout={ layout }
							removeLabel={ `Cancel upload of ${ SHORT_IMAGE.name }` }
							progress={
								<Progress.Root
									className={ styles.progress }
									value={ 60 }
									aria-label={ `Uploading ${ SHORT_IMAGE.name }` }
								>
									<Progress.Track>
										<Progress.Indicator />
									</Progress.Track>
								</Progress.Root>
							}
							onRemove={ noop }
						/>
					</li>
					<li>
						<SelectedFile
							file={ LONG_IMAGE }
							layout={ layout }
							status="Uploaded"
							onRemove={ noop }
						/>
					</li>
					<li>
						<SelectedFile
							file={ LONG_PDF }
							layout={ layout }
							showDetails={ false }
							status={
								<Badge intent="high">Couldn’t upload</Badge>
							}
							actions={
								<Button
									variant="minimal"
									tone="neutral"
									size="small"
									aria-label={ `Retry uploading ${ LONG_PDF.name }` }
								>
									Retry
								</Button>
							}
							onRemove={ noop }
						/>
					</li>
				</List>
			</Fieldset.Root>
		</Stack>
	);
}

function FileRowLayouts( { layout }: { layout: FileRowLayout } ) {
	return (
		<Stack direction="row" gap="2xl" align="flex-start">
			<Field layout={ layout } width={ 480 } />
			<Field layout={ layout } width={ 300 } />
		</Stack>
	);
}

const meta = {
	title: 'Design System/Patterns/File Row Layouts (Temporary)',
	component: FileRowLayouts,
	parameters: { controls: { disable: true } },
} satisfies Meta< typeof FileRowLayouts >;

export default meta;

type Story = StoryObj< typeof meta >;

/** Each row decides on its own whether its details fit next to its name. */
export const Current: Story = { args: { layout: 'wrap' } };

/** The details are always below the name. */
export const OptionAStacked: Story = {
	name: 'Option A: Stacked',
	args: { layout: 'stacked' },
};

/**
 * The details always share the name's first line, and only the name wraps.
 * Below 400px, every row stacks.
 */
export const OptionBInline: Story = {
	name: 'Option B: Inline',
	args: { layout: 'inline' },
};
