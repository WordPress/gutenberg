/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog,
	__experimentalItemGroup as ItemGroup,
	FlexItem,
	Notice,
	TextareaControl,
	TextControl,
	useNavigator,
} from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { Stack, Text } from '@wordpress/ui';
// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { code, plus, trash } from '@wordpress/icons';
import {
	isValidCSSClassName,
	normalizeCSSClassName,
	type CSSClassDefinition,
} from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { ScreenHeader } from './screen-header';
import { ScreenBody } from './screen-body';
import { useStyle } from './hooks';
import { unlock } from './lock-unlock';
import {
	getCSSClassUsageCounts,
	getCSSClassUsages,
	type BlockLike,
	type CSSClassUsage,
	type CSSClassUsageData,
} from './css-classes';

const { getCSSDeclarationBlockValidationError } = unlock(
	blockEditorPrivateApis
);

/*
 * TODO: North star: managed classes should behave like first-class design tokens
 * for block markup. They should be discoverable where authors add classes,
 * inspectable where designers/site builders manage styles, safely
 * rename/delete-able, and reliably counted across every entity that can contain
 * blocks.
 * TODO: Add a theme provider for starter managed classes.
 * TODO: Add duplicate class support.
 * TODO: Mark unused classes.
 * TODO: Add bulk apply/remove for selected blocks.
 * TODO: Offer to convert ad hoc classes found in content into managed classes.
 * TODO: Add import/export of classes.
 */

function decodeClassName( value?: string | string[] ) {
	if ( ! value ) {
		return '';
	}

	const rawValue = Array.isArray( value ) ? value[ 0 ] : value;

	try {
		return decodeURIComponent( rawValue );
	} catch {
		return rawValue;
	}
}

function useCSSClasses() {
	const [ value, setValue ] = useStyle< CSSClassDefinition[] >(
		'cssClasses',
		undefined,
		'user',
		false
	);

	return [ Array.isArray( value ) ? value : [], setValue ] as const;
}

function useBaseCSSClasses() {
	const [ value ] = useStyle< CSSClassDefinition[] >(
		'cssClasses',
		undefined,
		'base',
		false
	);

	return Array.isArray( value ) ? value : [];
}

interface ScreenCSSClassesProps {
	contentBlocks?: BlockLike[];
	currentEntity?: CSSClassUsageEntity;
}

interface ScreenCSSClassUsagesProps {
	contentBlocks?: BlockLike[];
	currentEntity?: CSSClassUsageEntity;
	siteUsages?: CSSClassUsage[];
	onSelectContentBlock?: ( clientId: string ) => void;
	onNavigateToEntity?: ( entity: CSSClassUsageEntity ) => void;
}

interface ScreenCSSClassEditProps {
	isNew?: boolean;
	onRenameContentClassName?: ( oldName: string, newName: string ) => void;
}

interface CSSClassUsageEntity {
	id?: string | number;
	type?: string;
}

interface CSSClassIssue {
	className: string;
	message: string;
	status: 'warning' | 'error' | 'info';
}

function useCSSClassUsageCounts(
	cssClasses: CSSClassDefinition[],
	contentBlocks: BlockLike[] = [],
	siteUsages: CSSClassUsage[] = [],
	currentEntity?: CSSClassUsageEntity
) {
	return useMemo( () => {
		const currentUsageCounts = getCSSClassUsageCounts(
			contentBlocks,
			cssClasses
		);
		const siteUsageCounts = siteUsages.reduce< Record< string, number > >(
			( counts, usage ) => {
				counts[ usage.className ] =
					( counts[ usage.className ] ?? 0 ) + 1;
				return counts;
			},
			{}
		);
		const currentEntityUsageCounts = siteUsages
			.filter( ( usage ) => isUsageForEntity( usage, currentEntity ) )
			.reduce< Record< string, number > >( ( counts, usage ) => {
				counts[ usage.className ] =
					( counts[ usage.className ] ?? 0 ) + 1;
				return counts;
			}, {} );

		return cssClasses.reduce< Record< string, number > >(
			( counts, item ) => {
				const className = normalizeCSSClassName( item.name );
				const currentCount = currentUsageCounts[ className ] ?? 0;
				const siteCount = siteUsageCounts[ className ] ?? 0;
				const currentEntityCount =
					currentEntityUsageCounts[ className ] ?? 0;
				counts[ className ] =
					siteCount -
					currentEntityCount +
					Math.max( currentCount, currentEntityCount );
				return counts;
			},
			{}
		);
	}, [ contentBlocks, cssClasses, currentEntity, siteUsages ] );
}

function isUsageForEntity(
	usage: CSSClassUsage,
	entity?: CSSClassUsageEntity
) {
	if ( ! entity?.id || ! entity?.type ) {
		return false;
	}

	return (
		String( usage.entityId ) === String( entity.id ) &&
		usage.entityType === entity.type
	);
}

function getUsageKey( usage: CSSClassUsage ) {
	return [
		usage.source,
		usage.entityType,
		usage.entityId,
		usage.blockName,
		usage.blockPath?.join( '.' ),
		usage.clientId,
	].join( ':' );
}

function canNavigateToUsage(
	usage: CSSClassUsage,
	onNavigateToEntity?: ( entity: CSSClassUsageEntity ) => void
) {
	return (
		!! onNavigateToEntity &&
		usage.source === 'post' &&
		!! usage.entityId &&
		!! usage.entityType
	);
}

function getUsageSummary( usages: CSSClassUsage[], limit = 5 ) {
	const summary = usages.reduce< Map< string, CSSClassUsage > >(
		( results, usage ) => {
			const key = [
				usage.source,
				usage.entityType,
				usage.entityId,
				usage.blockName,
				usage.blockPath?.join( '.' ),
			].join( ':' );

			if ( ! results.has( key ) ) {
				results.set( key, usage );
			}

			return results;
		},
		new Map()
	);

	return Array.from( summary.values() ).slice( 0, limit );
}

function CSSClassUsageWarning( { usages }: { usages: CSSClassUsage[] } ) {
	if ( ! usages.length ) {
		return null;
	}

	const visibleUsages = getUsageSummary( usages );
	const remainingUsageCount = Math.max(
		usages.length - visibleUsages.length,
		0
	);

	return (
		<Stack direction="column" gap="xs">
			<Text>
				{ sprintf(
					/* translators: %d: Number of class usages. */
					_n(
						'%d existing usage will be affected.',
						'%d existing usages will be affected.',
						usages.length
					),
					usages.length
				) }
			</Text>
			<ul>
				{ visibleUsages.map( ( usage ) => (
					<li key={ getUsageKey( usage ) }>
						{ sprintf(
							/* translators: 1: Entity title. 2: Block title. */
							__( '%1$s, %2$s block' ),
							usage.entityTitle ||
								usage.entityLabel ||
								__( 'Current canvas' ),
							usage.blockTitle
						) }
					</li>
				) ) }
			</ul>
			{ remainingUsageCount > 0 && (
				<Text variant="body-sm">
					{ sprintf(
						/* translators: %d: Number of additional class usages. */
						_n(
							'And %d more usage.',
							'And %d more usages.',
							remainingUsageCount
						),
						remainingUsageCount
					) }
				</Text>
			) }
		</Stack>
	);
}

function useCSSClassSiteUsageData() {
	const [ usageData, setUsageData ] = useState< CSSClassUsageData >( {
		usages: [],
		counts: {},
		classNames: [],
		canManageCssClasses: false,
	} );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ error, setError ] = useState< Error | null >( null );

	const refresh = useCallback( () => {
		let isMounted = true;
		setIsLoading( true );
		setError( null );

		apiFetch< CSSClassUsageData >( {
			path: '/wp/v2/css-class-usages',
		} )
			.then( ( response ) => {
				if ( isMounted ) {
					setUsageData( {
						usages: Array.isArray( response.usages )
							? response.usages
							: [],
						counts: response.counts ?? {},
						classNames: Array.isArray( response.classNames )
							? response.classNames
							: [],
						canManageCssClasses: !! response.canManageCssClasses,
					} );
				}
			} )
			.catch( ( nextError ) => {
				if ( isMounted ) {
					setError( nextError );
				}
			} )
			.finally( () => {
				if ( isMounted ) {
					setIsLoading( false );
				}
			} );

		return () => {
			isMounted = false;
		};
	}, [] );

	useEffect( () => refresh(), [ refresh ] );

	return { usageData, isLoading, error, refresh };
}

function getClassNameError(
	name: string,
	cssClasses: CSSClassDefinition[],
	originalName?: string
) {
	const normalizedName = normalizeCSSClassName( name );

	if ( ! normalizedName ) {
		return null;
	}

	if ( ! isValidCSSClassName( normalizedName ) ) {
		return __(
			'Use letters, numbers, hyphens, or underscores, and start with a letter, hyphen, or underscore.'
		);
	}

	const normalizedOriginalName = normalizeCSSClassName( originalName );

	if (
		normalizedName !== normalizedOriginalName &&
		cssClasses.some(
			( cssClass ) =>
				normalizeCSSClassName( cssClass.name ) === normalizedName
		)
	) {
		return __( 'A CSS class with this name already exists.' );
	}

	return null;
}

function getCSSClassesWithout(
	cssClasses: CSSClassDefinition[],
	name: string
) {
	const normalizedName = normalizeCSSClassName( name );
	return cssClasses.filter(
		( cssClass ) =>
			normalizeCSSClassName( cssClass.name ) !== normalizedName
	);
}

function getNormalizedClassNameSet( cssClasses: CSSClassDefinition[] ) {
	return new Set(
		cssClasses
			.map( ( cssClass ) => normalizeCSSClassName( cssClass.name ) )
			.filter( Boolean )
	);
}

function getDuplicateClassNames( cssClasses: CSSClassDefinition[] ) {
	const counts = cssClasses.reduce< Record< string, number > >(
		( result, cssClass ) => {
			const className = normalizeCSSClassName( cssClass.name );
			if ( className ) {
				result[ className ] = ( result[ className ] ?? 0 ) + 1;
			}
			return result;
		},
		{}
	);

	return Object.keys( counts ).filter(
		( className ) => counts[ className ] > 1
	);
}

function getClassProvenance(
	className: string,
	userClassNames: Set< string >,
	baseClassNames: Set< string >,
	usedClassNames: Set< string >
) {
	return [
		userClassNames.has( className ) && __( 'user global styles' ),
		baseClassNames.has( className ) && __( 'theme global styles' ),
		usedClassNames.has( className ) && __( 'content usage' ),
	].filter( Boolean );
}

function getCSSClassIssues(
	userCSSClasses: CSSClassDefinition[],
	baseCSSClasses: CSSClassDefinition[]
): CSSClassIssue[] {
	const userClassNames = getNormalizedClassNameSet( userCSSClasses );
	const baseClassNames = getNormalizedClassNameSet( baseCSSClasses );
	const managedClassNames = new Set( [
		...userClassNames,
		...baseClassNames,
	] );
	const issues: CSSClassIssue[] = [];

	[ ...managedClassNames ].forEach( ( className ) => {
		if ( ! isValidCSSClassName( className ) ) {
			issues.push( {
				className,
				status: 'error',
				message: sprintf(
					/* translators: %s: CSS class name. */
					__( '".%s" is not a valid managed CSS class name.' ),
					className
				),
			} );
		}

		if ( className.startsWith( 'wp-block-' ) ) {
			issues.push( {
				className,
				status: 'warning',
				message: sprintf(
					/* translators: %s: CSS class name. */
					__(
						'".%s" looks like a core block class and may collide with WordPress generated markup.'
					),
					className
				),
			} );
		}

		if (
			userClassNames.has( className ) &&
			baseClassNames.has( className )
		) {
			issues.push( {
				className,
				status: 'warning',
				message: sprintf(
					/* translators: %s: CSS class name. */
					__(
						'".%s" is defined by both user global styles and theme global styles.'
					),
					className
				),
			} );
		}
	} );

	getDuplicateClassNames( userCSSClasses ).forEach( ( className ) => {
		issues.push( {
			className,
			status: 'warning',
			message: sprintf(
				/* translators: %s: CSS class name. */
				__( '".%s" has multiple user global style definitions.' ),
				className
			),
		} );
	} );

	getDuplicateClassNames( baseCSSClasses ).forEach( ( className ) => {
		issues.push( {
			className,
			status: 'warning',
			message: sprintf(
				/* translators: %s: CSS class name. */
				__( '".%s" has multiple theme global style definitions.' ),
				className
			),
		} );
	} );

	return issues;
}

export default function ScreenCSSClasses( {
	contentBlocks,
	currentEntity,
}: ScreenCSSClassesProps ) {
	const { goTo } = useNavigator();
	const [ cssClasses ] = useCSSClasses();
	const baseCSSClasses = useBaseCSSClasses();
	const { usageData, isLoading, error } = useCSSClassSiteUsageData();
	const { canManageCssClasses } = usageData;
	const usageCounts = useCSSClassUsageCounts(
		cssClasses,
		contentBlocks,
		usageData.usages,
		currentEntity
	);
	const userClassNames = useMemo(
		() => getNormalizedClassNameSet( cssClasses ),
		[ cssClasses ]
	);
	const baseClassNames = useMemo(
		() => getNormalizedClassNameSet( baseCSSClasses ),
		[ baseCSSClasses ]
	);
	const usedClassNames = useMemo(
		() => new Set( usageData.classNames ),
		[ usageData.classNames ]
	);
	const cssClassIssues = useMemo(
		() => getCSSClassIssues( cssClasses, baseCSSClasses ),
		[ baseCSSClasses, cssClasses ]
	);

	return (
		<>
			<ScreenHeader
				title={ __( 'CSS classes' ) }
				description={ __(
					'Create CSS classes for use in the block Advanced settings.'
				) }
			/>
			<ScreenBody className="global-styles-ui-css-classes">
				<Stack direction="column" gap="md">
					{ canManageCssClasses && (
						<Button
							__next40pxDefaultSize
							icon={ plus }
							variant="primary"
							onClick={ () => goTo( '/css-classes/new' ) }
						>
							{ __( 'Add class' ) }
						</Button>
					) }
					{ ! canManageCssClasses && ! isLoading && (
						<Notice status="info" isDismissible={ false }>
							{ __(
								'Only administrators can create, edit, or delete managed CSS classes.'
							) }
						</Notice>
					) }
					{ isLoading && (
						<Notice status="info" isDismissible={ false }>
							{ __( 'Loading CSS class usages.' ) }
						</Notice>
					) }
					{ error && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'Could not load site-wide CSS class usages.'
							) }
						</Notice>
					) }
					{ cssClassIssues.length > 0 && (
						<Stack direction="column" gap="xs">
							<Text variant="heading-sm">
								{ __( 'Class conflicts and provenance' ) }
							</Text>
							{ cssClassIssues.map( ( issue, index ) => (
								<Notice
									key={ `${ issue.className }-${ index }` }
									status={ issue.status }
									isDismissible={ false }
								>
									{ issue.message }
								</Notice>
							) ) }
						</Stack>
					) }
					{ cssClasses.length === 0 && (
						<Notice status="info" isDismissible={ false }>
							{ __( 'No CSS classes yet.' ) }
						</Notice>
					) }
					{ cssClasses.length > 0 && (
						<ItemGroup className="global-styles-ui-css-classes__list">
							{ cssClasses.map( ( cssClass ) => {
								const className = normalizeCSSClassName(
									cssClass.name
								);
								const usageCount =
									usageCounts[ className ] ?? 0;

								return (
									<Stack
										className="global-styles-ui-css-classes__item"
										key={ className }
										direction="column"
									>
										<Stack
											className="global-styles-ui-css-classes__item-header"
											align="center"
											direction="row"
											justify="space-between"
										>
											<FlexItem>
												<Button
													__next40pxDefaultSize
													icon={ code }
													variant="tertiary"
													disabled={
														! canManageCssClasses
													}
													accessibleWhenDisabled
													onClick={ () =>
														goTo(
															`/css-classes/edit/${ encodeURIComponent(
																className
															) }`
														)
													}
												>
													{ `.${ className }` }
												</Button>
											</FlexItem>
											<Button
												__next40pxDefaultSize
												variant="tertiary"
												onClick={ () =>
													goTo(
														`/css-classes/usages/${ encodeURIComponent(
															className
														) }`
													)
												}
											>
												{ sprintf(
													/* translators: %d: Number of class usages. */
													_n(
														'%d use',
														'%d uses',
														usageCount
													),
													usageCount
												) }
											</Button>
										</Stack>
										<Text
											className="global-styles-ui-css-classes__item-provenance"
											variant="body-sm"
										>
											{ sprintf(
												/* translators: %s: Comma-separated provenance labels. */
												__( 'Defined by %s.' ),
												getClassProvenance(
													className,
													userClassNames,
													baseClassNames,
													usedClassNames
												).join( ', ' )
											) }
										</Text>
									</Stack>
								);
							} ) }
						</ItemGroup>
					) }
				</Stack>
			</ScreenBody>
		</>
	);
}

export function ScreenCSSClassEdit( {
	isNew = false,
	onRenameContentClassName,
}: ScreenCSSClassEditProps ) {
	const { goBack, goTo, params } = useNavigator();
	const originalName = isNew ? '' : decodeClassName( params.className );
	const [ cssClasses, setCSSClasses ] = useCSSClasses();
	const { usageData } = useCSSClassSiteUsageData();
	const { canManageCssClasses } = usageData;
	const existingClass = useMemo(
		() =>
			cssClasses.find(
				( cssClass ) =>
					normalizeCSSClassName( cssClass.name ) === originalName
			),
		[ cssClasses, originalName ]
	);
	const [ name, setName ] = useState(
		isNew ? '' : existingClass?.name ?? originalName
	);
	const [ css, setCSS ] = useState( isNew ? '' : existingClass?.css ?? '' );
	const [ isDeleteConfirmOpen, setIsDeleteConfirmOpen ] = useState( false );
	const [ isRenameConfirmOpen, setIsRenameConfirmOpen ] = useState( false );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ saveError, setSaveError ] = useState< Error | null >( null );

	useEffect( () => {
		if ( ! isNew && ! existingClass ) {
			goTo( '/css-classes' );
		}
	}, [ existingClass, goTo, isNew ] );

	const normalizedName = normalizeCSSClassName( name );
	const nameError = getClassNameError(
		name,
		cssClasses,
		isNew ? undefined : originalName
	);
	const cssError = getCSSDeclarationBlockValidationError( css );
	const hasChanges =
		normalizedName !== normalizeCSSClassName( existingClass?.name ) ||
		css !== ( existingClass?.css ?? '' );
	const isRename =
		! isNew &&
		!! normalizedName &&
		normalizedName !== normalizeCSSClassName( originalName );
	const canSave =
		!! normalizedName &&
		!! css.trim() &&
		! nameError &&
		! cssError &&
		( isNew || hasChanges ) &&
		! isSaving &&
		canManageCssClasses;
	const originalClassUsages = useMemo(
		() =>
			usageData.usages.filter(
				( usage ) =>
					usage.className === normalizeCSSClassName( originalName )
			),
		[ originalName, usageData.usages ]
	);

	function updateCSSClassDefinition() {
		const nextCSSClass = {
			name: normalizedName,
			css: css.trim(),
		};
		const nextCSSClasses = isNew
			? [ ...cssClasses, nextCSSClass ]
			: getCSSClassesWithout( cssClasses, originalName ).concat(
					nextCSSClass
			  );

		setCSSClasses( nextCSSClasses );
		goTo( '/css-classes' );
	}

	async function confirmRenameCSSClass() {
		setIsSaving( true );
		setSaveError( null );

		try {
			await apiFetch( {
				path: `/wp/v2/css-class-usages/${ encodeURIComponent(
					normalizeCSSClassName( originalName )
				) }/rename`,
				method: 'POST',
				data: { newName: normalizedName },
			} );
			onRenameContentClassName?.(
				normalizeCSSClassName( originalName ),
				normalizedName
			);
			updateCSSClassDefinition();
		} catch ( error ) {
			setSaveError( error as Error );
			setIsSaving( false );
			setIsRenameConfirmOpen( false );
		}
	}

	function saveCSSClass() {
		if ( ! canSave ) {
			return;
		}

		if ( isRename ) {
			setIsRenameConfirmOpen( true );
			return;
		}

		updateCSSClassDefinition();
	}

	function deleteCSSClass() {
		setCSSClasses( getCSSClassesWithout( cssClasses, originalName ) );
		goTo( '/css-classes' );
	}

	return (
		<>
			{ isDeleteConfirmOpen && (
				<ConfirmDialog
					isOpen={ isDeleteConfirmOpen }
					cancelButtonText={ __( 'Cancel' ) }
					confirmButtonText={ __( 'Delete' ) }
					onCancel={ () => setIsDeleteConfirmOpen( false ) }
					onConfirm={ deleteCSSClass }
					size="medium"
				>
					<Stack direction="column" gap="sm">
						<Text>
							{ sprintf(
								/* translators: %s: CSS class name. */
								__(
									'Are you sure you want to delete ".%s"? Blocks using this class will keep the class name, but it will no longer be managed by global styles.'
								),
								originalName
							) }
						</Text>
						<CSSClassUsageWarning usages={ originalClassUsages } />
					</Stack>
				</ConfirmDialog>
			) }
			{ isRenameConfirmOpen && (
				<ConfirmDialog
					isOpen={ isRenameConfirmOpen }
					cancelButtonText={ __( 'Cancel' ) }
					confirmButtonText={ __( 'Rename and update usages' ) }
					onCancel={ () => setIsRenameConfirmOpen( false ) }
					onConfirm={ confirmRenameCSSClass }
					size="medium"
				>
					<Stack direction="column" gap="sm">
						<Text>
							{ sprintf(
								/* translators: 1: Old CSS class name. 2: New CSS class name. */
								__(
									'Rename ".%1$s" to ".%2$s" and update all existing usages?'
								),
								originalName,
								normalizedName
							) }
						</Text>
						<CSSClassUsageWarning usages={ originalClassUsages } />
					</Stack>
				</ConfirmDialog>
			) }
			<ScreenHeader
				title={
					isNew
						? __( 'Add CSS class' )
						: sprintf(
								/* translators: %s: CSS class name. */
								__( 'Edit .%s' ),
								originalName
						  )
				}
			/>
			<ScreenBody className="global-styles-ui-css-classes">
				<Stack direction="column" gap="md">
					{ nameError && (
						<Notice status="error" isDismissible={ false }>
							{ nameError }
						</Notice>
					) }
					{ cssError && (
						<Notice status="error" isDismissible={ false }>
							{ cssError }
						</Notice>
					) }
					{ saveError && (
						<Notice status="error" isDismissible={ false }>
							{ saveError.message ||
								__( 'Could not update CSS class usages.' ) }
						</Notice>
					) }
					{ ! canManageCssClasses && (
						<Notice status="info" isDismissible={ false }>
							{ __(
								'Only administrators can create, edit, or delete managed CSS classes.'
							) }
						</Notice>
					) }
					<TextControl
						__next40pxDefaultSize
						label={ __( 'Class name' ) }
						value={ name }
						onChange={ setName }
						disabled={ ! canManageCssClasses }
						autoComplete="off"
						placeholder={ __( 'my-class' ) }
					/>
					<TextareaControl
						label={ __( 'CSS' ) }
						value={ css }
						onChange={ setCSS }
						spellCheck={ false }
						disabled={ ! canManageCssClasses }
						help={ __(
							'Enter declarations without curly braces.'
						) }
					/>
					<Stack
						direction="row"
						justify="space-between"
						align="center"
					>
						<FlexItem>
							{ ! isNew && canManageCssClasses && (
								<Button
									__next40pxDefaultSize
									icon={ trash }
									isDestructive
									variant="tertiary"
									onClick={ () =>
										setIsDeleteConfirmOpen( true )
									}
								>
									{ __( 'Delete' ) }
								</Button>
							) }
						</FlexItem>
						<Stack direction="row" gap="xs" justify="flex-end">
							<Button
								__next40pxDefaultSize
								variant="tertiary"
								onClick={ () => goBack() }
							>
								{ __( 'Cancel' ) }
							</Button>
							<Button
								__next40pxDefaultSize
								variant="primary"
								disabled={ ! canSave }
								accessibleWhenDisabled
								onClick={ saveCSSClass }
							>
								{ __( 'Save' ) }
							</Button>
						</Stack>
					</Stack>
				</Stack>
			</ScreenBody>
		</>
	);
}

export function ScreenCSSClassUsages( {
	contentBlocks = [],
	currentEntity,
	siteUsages = [],
	onSelectContentBlock,
	onNavigateToEntity,
}: ScreenCSSClassUsagesProps ) {
	const { params } = useNavigator();
	const className = decodeClassName( params.className );
	const { usageData, isLoading, error } = useCSSClassSiteUsageData();
	const allSiteUsages = siteUsages.length ? siteUsages : usageData.usages;
	const visibleUsages = useMemo(
		() => getCSSClassUsages( contentBlocks, className ),
		[ contentBlocks, className ]
	);
	const normalizedClassName = normalizeCSSClassName( className );
	const siteClassUsages = useMemo(
		() =>
			allSiteUsages.filter(
				( usage ) => usage.className === normalizedClassName
			),
		[ allSiteUsages, normalizedClassName ]
	);
	const currentEntityUsages = useMemo(
		() =>
			siteClassUsages.filter( ( usage ) =>
				isUsageForEntity( usage, currentEntity )
			),
		[ currentEntity, siteClassUsages ]
	);
	const elsewhereUsages = useMemo(
		() =>
			siteClassUsages.filter(
				( usage ) => ! isUsageForEntity( usage, currentEntity )
			),
		[ currentEntity, siteClassUsages ]
	);
	const currentUsageCount = Math.max(
		visibleUsages.length,
		currentEntityUsages.length
	);
	const totalUsageCount = currentUsageCount + elsewhereUsages.length;

	return (
		<>
			<ScreenHeader
				title={ sprintf(
					/* translators: %s: CSS class name. */
					__( 'Usages of .%s' ),
					className
				) }
			/>
			<ScreenBody className="global-styles-ui-css-classes">
				{ isLoading && (
					<Notice status="info" isDismissible={ false }>
						{ __( 'Loading CSS class usages.' ) }
					</Notice>
				) }
				{ error && (
					<Notice status="warning" isDismissible={ false }>
						{ __( 'Could not load site-wide CSS class usages.' ) }
					</Notice>
				) }
				{ totalUsageCount === 0 && (
					<Notice status="info" isDismissible={ false }>
						{ __( 'No usages found.' ) }
					</Notice>
				) }
				{ totalUsageCount > 0 && (
					<Stack direction="column" gap="md">
						<Text>
							{ sprintf(
								/* translators: %d: Number of class usages. */
								_n(
									'%d total usage found.',
									'%d total usages found.',
									totalUsageCount
								),
								totalUsageCount
							) }
						</Text>
						{ visibleUsages.length > 0 && (
							<>
								<Text variant="heading-sm">
									{ __( 'Visible in this canvas' ) }
								</Text>
								<ItemGroup className="global-styles-ui-css-classes__list">
									{ visibleUsages.map( ( usage ) => (
										<Button
											key={ usage.clientId }
											__next40pxDefaultSize
											className="global-styles-ui-css-classes__usage"
											variant="tertiary"
											onClick={ () =>
												usage.clientId &&
												onSelectContentBlock?.(
													usage.clientId
												)
											}
										>
											<Text>{ usage.blockTitle }</Text>
										</Button>
									) ) }
								</ItemGroup>
							</>
						) }
						{ elsewhereUsages.length > 0 && (
							<>
								<Text variant="heading-sm">
									{ __( 'Elsewhere on this site' ) }
								</Text>
								<ItemGroup className="global-styles-ui-css-classes__list">
									{ elsewhereUsages.map( ( usage ) => (
										<Button
											key={ getUsageKey( usage ) }
											__next40pxDefaultSize
											className="global-styles-ui-css-classes__usage"
											variant="tertiary"
											disabled={
												! canNavigateToUsage(
													usage,
													onNavigateToEntity
												)
											}
											accessibleWhenDisabled
											onClick={ () =>
												onNavigateToEntity?.( {
													id: usage.entityId,
													type: usage.entityType,
												} )
											}
										>
											<Stack direction="column" gap="xs">
												<Text>
													{ usage.entityTitle }
												</Text>
												<Text variant="body-sm">
													{ sprintf(
														/* translators: 1: Entity type label. 2: Block title. */
														__(
															'%1$s, %2$s block'
														),
														usage.entityLabel ||
															__( 'Content' ),
														usage.blockTitle
													) }
												</Text>
											</Stack>
										</Button>
									) ) }
								</ItemGroup>
							</>
						) }
					</Stack>
				) }
			</ScreenBody>
		</>
	);
}
