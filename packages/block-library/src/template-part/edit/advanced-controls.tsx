import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import type { BlockEditProps } from '@wordpress/blocks';
import { TextControl } from '@wordpress/components';
import { SelectControl } from '@wordpress/ui';
import { sprintf, __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { TemplatePartImportControls } from './import-controls';
import { unlock } from '../../lock-unlock';
import type { TemplatePartAttributes } from '../types';

const { HTMLElementControl } = unlock( blockEditorPrivateApis );

// The default tag name is stored as an empty string, but the select treats an
// empty value as no selection and shows its placeholder.
const DEFAULT_TAG_NAME = '__default';

interface TemplatePartAdvancedControlsProps {
	tagName?: string;
	setAttributes: BlockEditProps< TemplatePartAttributes >[ 'setAttributes' ];
	isEntityAvailable: boolean;
	templatePartId: string | null;
	defaultWrapper: string;
	hasInnerBlocks: boolean;
	clientId: string;
}

export function TemplatePartAdvancedControls( {
	tagName,
	setAttributes,
	isEntityAvailable,
	templatePartId,
	defaultWrapper,
	hasInnerBlocks,
	clientId,
}: TemplatePartAdvancedControlsProps ) {
	const [ area, setArea ] = useEntityProp(
		'postType',
		'wp_template_part',
		'area',
		templatePartId ?? undefined
	);

	const [ title, setTitle ] = useEntityProp(
		'postType',
		'wp_template_part',
		'title',
		templatePartId ?? undefined
	);

	const defaultTemplatePartAreas = useSelect(
		( select ) =>
			select( coreStore ).getCurrentTheme()
				?.default_template_part_areas || [],
		[]
	);

	const areaOptions = defaultTemplatePartAreas.map(
		( { label, area: _area }: { label: string; area: string } ) => ( {
			label,
			value: _area,
		} )
	);

	return (
		<>
			{ isEntityAvailable && (
				<>
					<TextControl
						label={ __( 'Title' ) }
						value={ title as string }
						onChange={ ( value ) => {
							setTitle( value );
						} }
						onFocus={ ( event ) => event.target.select() }
					/>
					<SelectControl
						label={ __( 'Area' ) }
						items={ areaOptions }
						value={
							areaOptions.find(
								( item: { value: string } ) =>
									item.value === area
							) ?? null
						}
						onValueChange={ ( item ) => {
							if ( item && item.value !== area ) {
								setArea( item.value );
							}
						} }
					/>
				</>
			) }
			<HTMLElementControl
				tagName={ tagName || DEFAULT_TAG_NAME }
				onChange={ ( value: string ) =>
					setAttributes( {
						tagName: value === DEFAULT_TAG_NAME ? '' : value,
					} )
				}
				clientId={ clientId }
				options={ [
					{
						label: sprintf(
							/* translators: %s: HTML tag based on area. */
							__( 'Default based on area (%s)' ),
							`<${ defaultWrapper }>`
						),
						value: DEFAULT_TAG_NAME,
					},
					{ label: '<header>', value: 'header' },
					{ label: '<main>', value: 'main' },
					{ label: '<section>', value: 'section' },
					{ label: '<article>', value: 'article' },
					{ label: '<aside>', value: 'aside' },
					{ label: '<footer>', value: 'footer' },
					{ label: '<div>', value: 'div' },
				] }
			/>
			{ ! hasInnerBlocks && (
				<TemplatePartImportControls
					area={ area as string | undefined }
					setAttributes={ setAttributes }
				/>
			) }
		</>
	);
}
