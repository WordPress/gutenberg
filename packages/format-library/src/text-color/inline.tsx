import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	applyFormat,
	removeFormat,
	getActiveFormat,
	useAnchor,
} from '@wordpress/rich-text';
import {
	ColorPalette,
	getColorClassName,
	getColorObjectByColorValue,
	getColorObjectByAttributeValues,
	store as blockEditorStore,
	// @ts-expect-error Block Editor not fully typed yet.
} from '@wordpress/block-editor';
import { Popover } from '@wordpress/components';
import { Tabs } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import type { RichTextValue } from '@wordpress/rich-text';
import type {
	ColorObject,
	ColorPickerProps,
	InlineColorUIProps,
} from '../types';
import { textColor as settings, transparentValue } from './index';

const TABS = [
	{ name: 'color', title: __( 'Text' ) },
	{ name: 'backgroundColor', title: __( 'Background' ) },
];

function parseCSS( css = '' ): { color?: string; backgroundColor?: string } {
	return css
		.split( ';' )
		.reduce(
			(
				accumulator: { color?: string; backgroundColor?: string },
				rule
			) => {
				if ( rule ) {
					const [ property, value ] = rule.split( ':' );
					if ( property === 'color' ) {
						accumulator.color = value;
					}
					if (
						property === 'background-color' &&
						value !== transparentValue
					) {
						accumulator.backgroundColor = value;
					}
				}
				return accumulator;
			},
			{}
		);
}

export function parseClassName(
	className = '',
	colorSettings: ColorObject[]
): { color?: string } {
	return className
		.split( ' ' )
		.reduce( ( accumulator: { color?: string }, name ) => {
			// `colorSlug` could contain dashes, so simply match the start and end.
			if ( name.startsWith( 'has-' ) && name.endsWith( '-color' ) ) {
				const colorSlug = name
					.replace( /^has-/, '' )
					.replace( /-color$/, '' );
				const colorObject = getColorObjectByAttributeValues(
					colorSettings,
					colorSlug
				);
				accumulator.color = colorObject.color;
			}
			return accumulator;
		}, {} );
}

export function getActiveColors(
	value: RichTextValue,
	name: string,
	colorSettings: ColorObject[]
): {
	color?: string;
	backgroundColor?: string;
} {
	const activeColorFormat = getActiveFormat( value, name );

	if ( ! activeColorFormat ) {
		return {};
	}

	return {
		...parseCSS( activeColorFormat.attributes?.style ),
		...parseClassName( activeColorFormat.attributes?.class, colorSettings ),
	};
}

function setColors(
	value: RichTextValue,
	name: string,
	colorSettings: ColorObject[],
	colors: { color?: string; backgroundColor?: string }
) {
	const { color, backgroundColor } = {
		...getActiveColors( value, name, colorSettings ),
		...colors,
	};

	if ( ! color && ! backgroundColor ) {
		return removeFormat( value, name );
	}

	const styles: string[] = [];
	const classNames: string[] = [];
	const attributes: { style?: string; class?: string } = {};

	if ( backgroundColor ) {
		styles.push( [ 'background-color', backgroundColor ].join( ':' ) );
	} else {
		// Override default browser color for mark element.
		styles.push( [ 'background-color', transparentValue ].join( ':' ) );
	}

	if ( color ) {
		const colorObject = getColorObjectByColorValue( colorSettings, color );

		if ( colorObject && colorObject.slug ) {
			const colorClassName = getColorClassName(
				'color',
				colorObject.slug
			);

			if ( colorClassName ) {
				classNames.push( colorClassName );
			}
		} else {
			styles.push( [ 'color', color ].join( ':' ) );
		}
	}

	if ( styles.length ) {
		attributes.style = styles.join( ';' );
	}
	if ( classNames.length ) {
		attributes.class = classNames.join( ' ' );
	}

	return applyFormat( value, { type: name, attributes } );
}

function ColorPicker( { name, property, value, onChange }: ColorPickerProps ) {
	const colors = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().colors ?? [];
	}, [] );
	const activeColors = useMemo(
		() => getActiveColors( value, name, colors ),
		[ name, value, colors ]
	);

	return (
		<ColorPalette
			value={ activeColors[ property ] }
			onChange={ ( color: string | undefined ) => {
				onChange(
					setColors( value, name, colors, { [ property ]: color } )
				);
			} }
			enableAlpha
			// Prevent the text and color picker from overlapping.
			__experimentalIsRenderedInSidebar
		/>
	);
}

export default function InlineColorUI( {
	name,
	value,
	onChange,
	onClose,
	contentRef,
	isActive,
}: InlineColorUIProps ) {
	/*
	 * `isActive` is not part of `WPFormat`, but `useAnchor` reads it
	 * dynamically. Hoisting the object out of the call avoids excess property
	 * checking, which only applies to object literals passed inline.
	 */
	const anchorSettings = { ...settings, isActive };
	const popoverAnchor = useAnchor( {
		// eslint-disable-next-line react-hooks/refs
		editableContentElement: contentRef.current,
		settings: anchorSettings,
	} );

	return (
		<Popover
			onClose={ onClose }
			className="format-library__inline-color-popover"
			anchor={ popoverAnchor }
		>
			<Tabs.Root defaultValue={ TABS[ 0 ].name }>
				<Tabs.List>
					{ TABS.map( ( tab ) => (
						<Tabs.Tab value={ tab.name } key={ tab.name }>
							{ tab.title }
						</Tabs.Tab>
					) ) }
				</Tabs.List>
				{ TABS.map( ( tab ) => (
					<Tabs.Panel
						value={ tab.name }
						tabIndex={ -1 }
						key={ tab.name }
					>
						<ColorPicker
							name={ name }
							property={ tab.name as 'color' | 'backgroundColor' }
							value={ value }
							onChange={ onChange }
						/>
					</Tabs.Panel>
				) ) }
			</Tabs.Root>
		</Popover>
	);
}
