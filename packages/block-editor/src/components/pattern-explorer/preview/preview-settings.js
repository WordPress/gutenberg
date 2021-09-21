/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	SelectControl,
	ToggleControl,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';

// TODO: check name of const..
const mediumViewWidths = [
	{ label: __( 'Medium (480px)' ), value: 480 },
	{ label: __( 'Narrow (320px)' ), value: 320 },
];

const largeViewWidths = [
	{
		label: __( 'Default (960px)' ),
		value: 960,
	},
	...mediumViewWidths,
];
const wideViewWidths = [
	{ label: __( 'Full (1200px)' ), value: 1200 },
	...largeViewWidths,
];

const MIN_PREVIEW_WIDTH = 280;

function PreviewWidths( { width, setWidth } ) {
	const showViewportControl = useViewportMatch( 'mobile', '>=' );
	const showViewportControlLarge = useViewportMatch( 'large', '>=' );
	const showViewportControlWide = useViewportMatch( 'wide', '>=' );

	const availableWidths = useMemo( () => {
		// Less than 480 wide.
		if ( ! showViewportControl ) {
			return [];
		}
		if ( showViewportControlWide ) {
			// More than 1280 wide.
			return wideViewWidths;
		} else if ( showViewportControlLarge ) {
			// Less than 1280, more than 960.
			return largeViewWidths;
		}
		// Less than 960, but larger than 480.
		return mediumViewWidths;
	}, [
		showViewportControl,
		showViewportControlWide,
		showViewportControlLarge,
	] );

	let currentOpt = false;
	if ( ! availableWidths.some( ( opt ) => opt.value === width ) ) {
		const displayWidth = Math.max( Math.floor( width ), MIN_PREVIEW_WIDTH );
		currentOpt = {
			/* translators: %s is the width in pixels, ex 600. */
			label: sprintf( __( 'Current (%spx)' ), displayWidth ),
			value: displayWidth,
		};
	}
	return (
		<div className="pattern-preview__size-control">
			{ showViewportControl && (
				<SelectControl
					hideLabelFromVision
					label={ __( 'Preview Width' ) }
					value={ width }
					options={
						currentOpt
							? [ currentOpt, ...availableWidths ]
							: availableWidths
					}
					onChange={ ( value ) => setWidth( Number( value ) ) }
				/>
			) }
		</div>
	);
}

function PreviewSettings( {
	width,
	setWidth,
	showPreviewWithContentControl,
	showPreviewWithContent,
	setShowPreviewWithContent,
} ) {
	return (
		<Flex
			justify="space-between"
			className="block-editor-pattern-explorer__preview__settings"
		>
			<FlexItem>
				<PreviewWidths width={ width } setWidth={ setWidth } />
			</FlexItem>
			{ showPreviewWithContentControl && (
				<FlexItem>
					<ToggleControl
						label="Show preview with parent block's content"
						checked={ !! showPreviewWithContent }
						onChange={ () =>
							setShowPreviewWithContent(
								! showPreviewWithContent
							)
						}
					/>
				</FlexItem>
			) }
		</Flex>
	);
}

export default PreviewSettings;
