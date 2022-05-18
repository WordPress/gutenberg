/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	InnerBlocks,
	useBlockProps,
	InspectorControls,
	useInnerBlocksProps,
	useSetting,
	store as blockEditorStore,
	HtmlElementControl,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

function GroupEdit( { attributes, setAttributes, clientId } ) {
	const { hasInnerBlocks, themeSupportsLayout } = useSelect(
		( select ) => {
			const { getBlock, getSettings } = select( blockEditorStore );
			const block = getBlock( clientId );
			return {
				hasInnerBlocks: !! ( block && block.innerBlocks.length ),
				themeSupportsLayout: getSettings()?.supportsLayout,
			};
		},
		[ clientId ]
	);
	const defaultLayout = useSetting( 'layout' ) || {};
	const { tagName: TagName = 'div', templateLock, layout = {} } = attributes;
	const usedLayout = !! layout && layout.inherit ? defaultLayout : layout;
	const { type = 'default' } = usedLayout;
	const layoutSupportEnabled = themeSupportsLayout || type !== 'default';

	const blockProps = useBlockProps( {
		className: `is-layout-${ type }`,
	} );

	const innerBlocksProps = useInnerBlocksProps(
		layoutSupportEnabled
			? blockProps
			: { className: 'wp-block-group__inner-container' },
		{
			templateLock,
			renderAppender: hasInnerBlocks
				? undefined
				: InnerBlocks.ButtonBlockAppender,
			__experimentalLayout: layoutSupportEnabled ? usedLayout : undefined,
		}
	);

	const tagNames = [
		{ label: __( 'Default (<div>)' ), value: 'div' },
		{ label: '<header>', value: 'header' },
		{ label: '<main>', value: 'main' },
		{ label: '<section>', value: 'section' },
		{ label: '<article>', value: 'article' },
		{ label: '<aside>', value: 'aside' },
		{ label: '<footer>', value: 'footer' },
	];

	return (
		<>
			<InspectorControls __experimentalGroup="advanced">
				<HtmlElementControl
					tagNameOptions={ tagNames }
					selectedValue={ TagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
				/>
			</InspectorControls>
			{ layoutSupportEnabled && <TagName { ...innerBlocksProps } /> }
			{ /* Ideally this is not needed but it's there for backward compatibility reason
				to keep this div for themes that might rely on its presence */ }
			{ ! layoutSupportEnabled && (
				<TagName { ...blockProps }>
					<div { ...innerBlocksProps } />
				</TagName>
			) }
		</>
	);
}

export default GroupEdit;
