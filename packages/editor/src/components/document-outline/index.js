/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { create, getTextContent } from '@wordpress/rich-text';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { Path, SVG, Line, Rect } from '@wordpress/components';

/**
 * Internal dependencies
 */
import DocumentOutlineItem from './item';
import { store as editorStore } from '../../store';

/**
 * Module constants
 */
const emptyHeadingContent = <em>{ __( '(Empty heading)' ) }</em>;
const incorrectLevelContent = [
	<br key="incorrect-break" />,
	<em key="incorrect-message">{ __( '(Incorrect heading level)' ) }</em>,
];
const singleH1Headings = [
	<br key="incorrect-break-h1" />,
	<em key="incorrect-message-h1">
		{ __( '(Your theme may already use a H1 for the post title)' ) }
	</em>,
];
const multipleH1Headings = [
	<br key="incorrect-break-multiple-h1" />,
	<em key="incorrect-message-multiple-h1">
		{ __( '(Multiple H1 headings are not recommended)' ) }
	</em>,
];
function EmptyOutlineIllustration() {
	return (
		<SVG
			width="138"
			height="148"
			viewBox="0 0 138 148"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<Rect width="138" height="148" rx="4" fill="#F0F6FC" />
			<Line x1="44" y1="28" x2="24" y2="28" stroke="#DDDDDD" />
			<Rect x="48" y="16" width="27" height="23" rx="4" fill="#DDDDDD" />
			<Path
				d="M54.7585 32V23.2727H56.6037V26.8736H60.3494V23.2727H62.1903V32H60.3494V28.3949H56.6037V32H54.7585ZM67.4574 23.2727V32H65.6122V25.0241H65.5611L63.5625 26.277V24.6406L65.723 23.2727H67.4574Z"
				fill="black"
			/>
			<Line x1="55" y1="59" x2="24" y2="59" stroke="#DDDDDD" />
			<Rect x="59" y="47" width="29" height="23" rx="4" fill="#DDDDDD" />
			<Path
				d="M65.7585 63V54.2727H67.6037V57.8736H71.3494V54.2727H73.1903V63H71.3494V59.3949H67.6037V63H65.7585ZM74.6605 63V61.6705L77.767 58.794C78.0313 58.5384 78.2528 58.3082 78.4318 58.1037C78.6136 57.8991 78.7514 57.6989 78.8452 57.5028C78.9389 57.304 78.9858 57.0895 78.9858 56.8594C78.9858 56.6037 78.9276 56.3835 78.8111 56.1989C78.6946 56.0114 78.5355 55.8679 78.3338 55.7685C78.1321 55.6662 77.9034 55.6151 77.6477 55.6151C77.3807 55.6151 77.1477 55.669 76.9489 55.777C76.75 55.8849 76.5966 56.0398 76.4886 56.2415C76.3807 56.4432 76.3267 56.6832 76.3267 56.9616H74.5753C74.5753 56.3906 74.7045 55.8949 74.9631 55.4744C75.2216 55.054 75.5838 54.7287 76.0497 54.4986C76.5156 54.2685 77.0526 54.1534 77.6605 54.1534C78.2855 54.1534 78.8295 54.2642 79.2926 54.4858C79.7585 54.7045 80.1207 55.0085 80.3793 55.3977C80.6378 55.7869 80.767 56.233 80.767 56.7358C80.767 57.0653 80.7017 57.3906 80.571 57.7116C80.4432 58.0327 80.2145 58.3892 79.8849 58.7812C79.5554 59.1705 79.0909 59.6378 78.4915 60.1832L77.2173 61.4318V61.4915H80.8821V63H74.6605Z"
				fill="black"
			/>
			<Line x1="80" y1="90" x2="24" y2="90" stroke="#DDDDDD" />
			<Rect x="84" y="78" width="30" height="23" rx="4" fill="#F0B849" />
			<Path
				d="M90.7585 94V85.2727H92.6037V88.8736H96.3494V85.2727H98.1903V94H96.3494V90.3949H92.6037V94H90.7585ZM99.5284 92.4659V91.0128L103.172 85.2727H104.425V87.2841H103.683L101.386 90.919V90.9872H106.564V92.4659H99.5284ZM103.717 94V92.0227L103.751 91.3793V85.2727H105.482V94H103.717Z"
				fill="black"
			/>
			<Line x1="66" y1="121" x2="24" y2="121" stroke="#DDDDDD" />
			<Rect x="70" y="109" width="29" height="23" rx="4" fill="#DDDDDD" />
			<Path
				d="M76.7585 125V116.273H78.6037V119.874H82.3494V116.273H84.1903V125H82.3494V121.395H78.6037V125H76.7585ZM88.8864 125.119C88.25 125.119 87.6832 125.01 87.1861 124.791C86.6918 124.57 86.3011 124.266 86.0142 123.879C85.7301 123.49 85.5838 123.041 85.5753 122.533H87.4332C87.4446 122.746 87.5142 122.933 87.642 123.095C87.7727 123.254 87.946 123.378 88.1619 123.466C88.3778 123.554 88.6207 123.598 88.8906 123.598C89.1719 123.598 89.4205 123.548 89.6364 123.449C89.8523 123.349 90.0213 123.212 90.1435 123.036C90.2656 122.859 90.3267 122.656 90.3267 122.426C90.3267 122.193 90.2614 121.987 90.1307 121.808C90.0028 121.626 89.8182 121.484 89.5767 121.382C89.3381 121.28 89.054 121.229 88.7244 121.229H87.9105V119.874H88.7244C89.0028 119.874 89.2486 119.825 89.4616 119.729C89.6776 119.632 89.8452 119.499 89.9645 119.328C90.0838 119.155 90.1435 118.953 90.1435 118.723C90.1435 118.504 90.0909 118.312 89.9858 118.148C89.8835 117.98 89.7386 117.849 89.5511 117.756C89.3665 117.662 89.1506 117.615 88.9034 117.615C88.6534 117.615 88.4247 117.661 88.2173 117.751C88.0099 117.839 87.8438 117.966 87.7188 118.131C87.5938 118.295 87.527 118.489 87.5185 118.71H85.75C85.7585 118.207 85.902 117.764 86.1804 117.381C86.4588 116.997 86.8338 116.697 87.3054 116.482C87.7798 116.263 88.3153 116.153 88.9119 116.153C89.5142 116.153 90.0412 116.263 90.4929 116.482C90.9446 116.7 91.2955 116.996 91.5455 117.368C91.7983 117.737 91.9233 118.152 91.9205 118.612C91.9233 119.101 91.7713 119.509 91.4645 119.835C91.1605 120.162 90.7642 120.369 90.2756 120.457V120.526C90.9176 120.608 91.4063 120.831 91.7415 121.195C92.0795 121.555 92.2472 122.007 92.2443 122.55C92.2472 123.047 92.1037 123.489 91.8139 123.875C91.527 124.261 91.1307 124.565 90.625 124.787C90.1193 125.009 89.5398 125.119 88.8864 125.119Z"
				fill="black"
			/>
		</SVG>
	);
}

/**
 * Returns an array of heading blocks enhanced with the following properties:
 * level   - An integer with the heading level.
 * isEmpty - Flag indicating if the heading has no content.
 *
 * @param {?Array} blocks An array of blocks.
 *
 * @return {Array} An array of heading blocks enhanced with the properties described above.
 */
const computeOutlineHeadings = ( blocks = [] ) => {
	return blocks.flatMap( ( block = {} ) => {
		if ( block.name === 'core/heading' ) {
			return {
				...block,
				level: block.attributes.level,
				isEmpty: isEmptyHeading( block ),
			};
		}
		return computeOutlineHeadings( block.innerBlocks );
	} );
};

const isEmptyHeading = ( heading ) =>
	! heading.attributes.content ||
	heading.attributes.content.trim().length === 0;

/**
 * Renders a document outline component.
 *
 * @param {Object}   props                         Props.
 * @param {Function} props.onSelect                Function to be called when an outline item is selected.
 * @param {boolean}  props.isTitleSupported        Indicates whether the title is supported.
 * @param {boolean}  props.hasOutlineItemsDisabled Indicates whether the outline items are disabled.
 *
 * @return {Component} The component to be rendered.
 */
export default function DocumentOutline( {
	onSelect,
	isTitleSupported,
	hasOutlineItemsDisabled,
} ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const { blocks, title } = useSelect( ( select ) => {
		const { getBlocks } = select( blockEditorStore );
		const { getEditedPostAttribute } = select( editorStore );
		const { getPostType } = select( coreStore );
		const postType = getPostType( getEditedPostAttribute( 'type' ) );

		return {
			title: getEditedPostAttribute( 'title' ),
			blocks: getBlocks(),
			isTitleSupported: postType?.supports?.title ?? false,
		};
	} );

	const headings = computeOutlineHeadings( blocks );
	if ( headings.length < 1 ) {
		return (
			<div className="editor-document-outline has-no-headings">
				<EmptyOutlineIllustration />
				<p>
					{ __(
						'Navigate the structure of your document and address issues like empty or incorrect heading levels.'
					) }
				</p>
			</div>
		);
	}

	let prevHeadingLevel = 1;

	// Not great but it's the simplest way to locate the title right now.
	const titleNode = document.querySelector( '.editor-post-title__input' );
	const hasTitle = isTitleSupported && title && titleNode;
	const countByLevel = headings.reduce(
		( acc, heading ) => ( {
			...acc,
			[ heading.level ]: ( acc[ heading.level ] || 0 ) + 1,
		} ),
		{}
	);
	const hasMultipleH1 = countByLevel[ 1 ] > 1;

	return (
		<div className="document-outline">
			<ul>
				{ hasTitle && (
					<DocumentOutlineItem
						level={ __( 'Title' ) }
						isValid
						onSelect={ onSelect }
						href={ `#${ titleNode.id }` }
						isDisabled={ hasOutlineItemsDisabled }
					>
						{ title }
					</DocumentOutlineItem>
				) }
				{ headings.map( ( item, index ) => {
					// Headings remain the same, go up by one, or down by any amount.
					// Otherwise there are missing levels.
					const isIncorrectLevel = item.level > prevHeadingLevel + 1;

					const isValid =
						! item.isEmpty &&
						! isIncorrectLevel &&
						!! item.level &&
						( item.level !== 1 ||
							( ! hasMultipleH1 && ! hasTitle ) );
					prevHeadingLevel = item.level;

					return (
						<DocumentOutlineItem
							key={ index }
							level={ `H${ item.level }` }
							isValid={ isValid }
							isDisabled={ hasOutlineItemsDisabled }
							href={ `#block-${ item.clientId }` }
							onSelect={ () => {
								selectBlock( item.clientId );
								onSelect?.();
							} }
						>
							{ item.isEmpty
								? emptyHeadingContent
								: getTextContent(
										create( {
											html: item.attributes.content,
										} )
								  ) }
							{ isIncorrectLevel && incorrectLevelContent }
							{ item.level === 1 &&
								hasMultipleH1 &&
								multipleH1Headings }
							{ hasTitle &&
								item.level === 1 &&
								! hasMultipleH1 &&
								singleH1Headings }
						</DocumentOutlineItem>
					);
				} ) }
			</ul>
		</div>
	);
}
