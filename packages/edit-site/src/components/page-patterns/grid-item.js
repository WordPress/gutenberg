/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	BlockPreview,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import {
	Button,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	Tooltip,
	Flex,
} from '@wordpress/components';
import { useId, memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Icon,
	header,
	footer,
	symbolFilled as uncategorized,
	symbol,
	lockSmall,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	PATTERN_TYPES,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_SYNC_TYPES,
} from '../../utils/constants';
import { useLink } from '../routes/link';
import { unlock } from '../../lock-unlock';
import PatternActions from '../pattern-actions';

const { useGlobalStyle } = unlock( blockEditorPrivateApis );
const templatePartIcons = { header, footer, uncategorized };

function GridItem( { categoryId, item, ...props } ) {
	const descriptionId = useId();
	const [ backgroundColor ] = useGlobalStyle( 'color.background' );

	const isUserPattern = item.type === PATTERN_TYPES.user;
	const isNonUserPattern = item.type === PATTERN_TYPES.theme;
	const isTemplatePart = item.type === TEMPLATE_PART_POST_TYPE;

	const { onClick } = useLink( {
		postType: item.type,
		postId: isUserPattern ? item.id : item.name,
		categoryId,
		categoryType: isTemplatePart ? item.type : PATTERN_TYPES.theme,
	} );

	const isEmpty = ! item.blocks?.length;
	const patternClassNames = classnames( 'edit-site-patterns__pattern', {
		'is-placeholder': isEmpty,
	} );
	const previewClassNames = classnames( 'edit-site-patterns__preview', {
		'is-inactive': isNonUserPattern,
	} );

	// Only custom patterns or custom template parts can be renamed or deleted.
	const isCustomPattern =
		isUserPattern || ( isTemplatePart && item.isCustom );
	const ariaDescriptions = [];

	if ( isCustomPattern ) {
		// User patterns don't have descriptions, but can be edited and deleted, so include some help text.
		ariaDescriptions.push(
			__( 'Press Enter to edit, or Delete to delete the pattern.' )
		);
	} else if ( item.description ) {
		ariaDescriptions.push( item.description );
	}

	if ( isNonUserPattern ) {
		ariaDescriptions.push(
			__( 'Theme & plugin patterns cannot be edited.' )
		);
	}

	let itemIcon;
	if ( ! isUserPattern && templatePartIcons[ categoryId ] ) {
		itemIcon = templatePartIcons[ categoryId ];
	} else {
		itemIcon =
			item.syncStatus === PATTERN_SYNC_TYPES.full ? symbol : undefined;
	}

	const additionalStyles = ! backgroundColor
		? [ { css: 'body { background: #fff; }' } ]
		: undefined;

	return (
		<li className={ patternClassNames }>
			<button
				className={ previewClassNames }
				// Even though still incomplete, passing ids helps performance.
				// @see https://reakit.io/docs/composite/#performance.
				id={ `edit-site-patterns-${ item.name }` }
				type="button"
				{ ...props }
				onClick={
					item.type !== PATTERN_TYPES.theme ? onClick : undefined
				}
				aria-disabled={
					item.type !== PATTERN_TYPES.theme ? 'false' : 'true'
				}
				aria-label={ item.title }
				aria-describedby={
					ariaDescriptions.length
						? ariaDescriptions
								.map(
									( _, index ) =>
										`${ descriptionId }-${ index }`
								)
								.join( ' ' )
						: undefined
				}
			>
				{ isEmpty && isTemplatePart && __( 'Empty template part' ) }
				{ isEmpty && ! isTemplatePart && __( 'Empty pattern' ) }
				{ ! isEmpty && (
					<BlockPreview
						blocks={ item.blocks }
						additionalStyles={ additionalStyles }
					/>
				) }
			</button>
			{ ariaDescriptions.map( ( ariaDescription, index ) => (
				<div
					key={ index }
					hidden
					id={ `${ descriptionId }-${ index }` }
				>
					{ ariaDescription }
				</div>
			) ) }
			<HStack
				className="edit-site-patterns__footer"
				justify="space-between"
			>
				<HStack
					alignment="center"
					justify="left"
					spacing={ 3 }
					className="edit-site-patterns__pattern-title"
				>
					{ itemIcon && ! isNonUserPattern && (
						<Tooltip
							placement="top"
							text={ __(
								'Editing this pattern will also update anywhere it is used'
							) }
						>
							<Icon
								className="edit-site-patterns__pattern-icon"
								icon={ itemIcon }
							/>
						</Tooltip>
					) }
					<Flex as="span" gap={ 0 } justify="left">
						{ item.type === PATTERN_TYPES.theme ? (
							item.title
						) : (
							<Heading level={ 5 }>
								<Button
									variant="link"
									onClick={ onClick }
									// Required for the grid's roving tab index system.
									// See https://github.com/WordPress/gutenberg/pull/51898#discussion_r1243399243.
									tabIndex="-1"
								>
									{ item.title || item.name }
								</Button>
							</Heading>
						) }
						{ item.type === PATTERN_TYPES.theme && (
							<Tooltip
								placement="top"
								text={ __( 'This pattern cannot be edited.' ) }
							>
								<Icon
									className="edit-site-patterns__pattern-lock-icon"
									icon={ lockSmall }
									size={ 24 }
								/>
							</Tooltip>
						) }
					</Flex>
				</HStack>
				<PatternActions
					item={ item }
					toggleProps={ { className: 'edit-site-patterns__button' } }
				/>
			</HStack>
		</li>
	);
}

export default memo( GridItem );
