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
import { Stack, Text } from '@wordpress/ui';
// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useEffect, useMemo, useState } from '@wordpress/element';
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
} from './css-classes';

const { getCSSDeclarationBlockValidationError } = unlock(
	blockEditorPrivateApis
);

function decodeClassName( value?: string ) {
	if ( ! value ) {
		return '';
	}

	try {
		return decodeURIComponent( value );
	} catch {
		return value;
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

interface ScreenCSSClassesProps {
	contentBlocks?: BlockLike[];
}

interface ScreenCSSClassUsagesProps {
	contentBlocks?: BlockLike[];
	onSelectContentBlock?: ( clientId: string ) => void;
}

function useCSSClassUsageCounts(
	cssClasses: CSSClassDefinition[],
	contentBlocks: BlockLike[] = []
) {
	return useMemo(
		() => getCSSClassUsageCounts( contentBlocks, cssClasses ),
		[ contentBlocks, cssClasses ]
	);
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

export default function ScreenCSSClasses( {
	contentBlocks,
}: ScreenCSSClassesProps ) {
	const { goTo } = useNavigator();
	const [ cssClasses ] = useCSSClasses();
	const usageCounts = useCSSClassUsageCounts( cssClasses, contentBlocks );

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
					<Button
						__next40pxDefaultSize
						icon={ plus }
						variant="primary"
						onClick={ () => goTo( '/css-classes/new' ) }
					>
						{ __( 'Add class' ) }
					</Button>
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
										align="center"
										direction="row"
										justify="space-between"
									>
										<FlexItem>
											<Button
												__next40pxDefaultSize
												icon={ code }
												variant="tertiary"
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
								);
							} ) }
						</ItemGroup>
					) }
				</Stack>
			</ScreenBody>
		</>
	);
}

export function ScreenCSSClassEdit( { isNew = false }: { isNew?: boolean } ) {
	const { goBack, goTo, params } = useNavigator();
	const originalName = isNew ? '' : decodeClassName( params.className );
	const [ cssClasses, setCSSClasses ] = useCSSClasses();
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
	const canSave =
		!! normalizedName &&
		!! css.trim() &&
		! nameError &&
		! cssError &&
		( isNew || hasChanges );

	function saveCSSClass() {
		if ( ! canSave ) {
			return;
		}

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
					{ sprintf(
						/* translators: %s: CSS class name. */
						__( 'Are you sure you want to delete ".%s"?' ),
						originalName
					) }
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
					<TextControl
						__next40pxDefaultSize
						label={ __( 'Class name' ) }
						value={ name }
						onChange={ setName }
						autoComplete="off"
						placeholder={ __( 'my-class' ) }
					/>
					<TextareaControl
						label={ __( 'CSS' ) }
						value={ css }
						onChange={ setCSS }
						spellCheck={ false }
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
							{ ! isNew && (
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
	onSelectContentBlock,
}: ScreenCSSClassUsagesProps ) {
	const { params } = useNavigator();
	const className = decodeClassName( params.className );
	const usages = useMemo(
		() => getCSSClassUsages( contentBlocks, className ),
		[ contentBlocks, className ]
	);

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
				{ usages.length === 0 && (
					<Notice status="info" isDismissible={ false }>
						{ __( 'No usages found.' ) }
					</Notice>
				) }
				{ usages.length > 0 && (
					<ItemGroup className="global-styles-ui-css-classes__list">
						{ usages.map( ( usage ) => (
							<Button
								key={ usage.clientId }
								__next40pxDefaultSize
								className="global-styles-ui-css-classes__usage"
								variant="tertiary"
								onClick={ () =>
									onSelectContentBlock?.( usage.clientId )
								}
							>
								<Text>{ usage.blockTitle }</Text>
							</Button>
						) ) }
					</ItemGroup>
				) }
			</ScreenBody>
		</>
	);
}
