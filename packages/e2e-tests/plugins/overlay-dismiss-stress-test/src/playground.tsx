/**
 * Cross-bundle overlay dismiss stress test playground.
 *
 * Renders test scenarios using two independent @base-ui/react bundles
 * (window.OverlayBundleA and window.OverlayBundleB) alongside a shared
 * React instance. Each scenario is rendered twice: once with both
 * components from the same bundle (baseline), and once with components
 * from different bundles (cross-bundle), enabling direct comparison.
 */

/* eslint-disable jsdoc/require-param */

const React = ( window as any ).React;
const ReactDOM = ( window as any ).ReactDOM;

const A = ( window as any ).OverlayBundleA;
const B = ( window as any ).OverlayBundleB;

const LegacyModal = ( window as any ).wp?.components?.Modal;
const LegacyPopover = ( window as any ).wp?.components?.Popover;

type BundleLib = typeof A;

function StatusIndicator( {
	label,
	isOpen,
	testId,
}: {
	label: string;
	isOpen: boolean;
	testId?: string;
} ) {
	return (
		<span
			data-testid={ testId }
			data-state={ isOpen ? 'open' : 'closed' }
			style={ {
				display: 'inline-flex',
				alignItems: 'center',
				gap: '4px',
				fontSize: '12px',
				padding: '2px 8px',
				borderRadius: '4px',
				background: isOpen ? '#d4edda' : '#f8f9fa',
				border: `1px solid ${ isOpen ? '#28a745' : '#dee2e6' }`,
			} }
		>
			<span
				style={ {
					width: '8px',
					height: '8px',
					borderRadius: '50%',
					background: isOpen ? '#28a745' : '#ccc',
				} }
			/>
			{ label }: { isOpen ? 'Open' : 'Closed' }
		</span>
	);
}

const popupStyle: React.CSSProperties = {
	background: '#fff',
	border: '1px solid #ccc',
	borderRadius: '8px',
	padding: '16px',
	boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
	maxWidth: '400px',
};

const backdropStyle: React.CSSProperties = {
	position: 'fixed',
	inset: 0,
	background: 'rgba(0,0,0,0.3)',
};

const selectTriggerStyle: React.CSSProperties = {
	padding: '6px 12px',
	border: '1px solid #ccc',
	borderRadius: '4px',
	background: '#fff',
	cursor: 'pointer',
	minWidth: '150px',
};

const selectPopupStyle: React.CSSProperties = {
	background: '#fff',
	border: '1px solid #ccc',
	borderRadius: '6px',
	padding: '4px',
	boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
};

const selectItemStyle: React.CSSProperties = {
	padding: '6px 12px',
	borderRadius: '4px',
	cursor: 'pointer',
};

const dialogPopupStyle: React.CSSProperties = {
	...popupStyle,
	position: 'fixed',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	minWidth: '350px',
};

function SelectItems( { lib }: { lib: BundleLib } ) {
	return (
		<>
			{ [ 'Apple', 'Banana', 'Cherry', 'Date', 'Elderberry' ].map(
				( fruit ) => (
					<lib.Select.Item
						key={ fruit }
						value={ fruit }
						style={ selectItemStyle }
					>
						<lib.Select.ItemText>{ fruit }</lib.Select.ItemText>
					</lib.Select.Item>
				)
			) }
		</>
	);
}

/**
 * Shared wrapper that renders a scenario card with a title and description.
 */
function ScenarioCard( {
	scenarioId,
	title,
	description,
	children,
}: {
	scenarioId: string;
	title: string;
	description: string;
	children: React.ReactNode;
} ) {
	return (
		<div
			style={ {
				border: '1px solid #ddd',
				borderRadius: '8px',
				padding: '16px',
				marginBottom: '16px',
				background: '#fff',
			} }
		>
			<h3 style={ { margin: '0 0 4px' } }>
				<span style={ { color: '#666', fontWeight: 'normal' } }>
					{ scenarioId }
				</span>{ ' ' }
				{ title }
			</h3>
			<p
				style={ {
					margin: '0 0 12px',
					color: '#666',
					fontSize: '13px',
				} }
			>
				{ description }
			</p>
			<div
				style={ {
					display: 'grid',
					gridTemplateColumns: '1fr 1fr',
					gap: '16px',
				} }
			>
				{ children }
			</div>
		</div>
	);
}

function VariantPanel( {
	testId,
	label,
	isCrossBundleVariant,
	children,
}: {
	testId: string;
	label: string;
	isCrossBundleVariant: boolean;
	children: React.ReactNode;
} ) {
	return (
		<div
			data-testid={ testId }
			style={ {
				padding: '12px',
				border: '1px solid #eee',
				borderRadius: '6px',
				background: isCrossBundleVariant ? '#fafafa' : '#fff',
			} }
		>
			<div
				style={ {
					fontSize: '11px',
					fontWeight: 600,
					textTransform: 'uppercase',
					letterSpacing: '0.05em',
					color: isCrossBundleVariant ? '#e67e22' : '#27ae60',
					marginBottom: '8px',
				} }
			>
				{ label }
			</div>
			{ children }
		</div>
	);
}

// ─── 1.1 Dialog + Select ────────────────────────────────────────────

function DialogSelectVariant( {
	D,
	S,
	prefix,
}: {
	D: BundleLib;
	S: BundleLib;
	prefix: string;
} ) {
	const [ dialogOpen, setDialogOpen ] = React.useState( false );
	return (
		<>
			<div
				style={ {
					display: 'flex',
					gap: '8px',
					alignItems: 'center',
					marginBottom: '8px',
				} }
			>
				<StatusIndicator
					label="Dialog"
					isOpen={ dialogOpen }
					testId={ `${ prefix }-dialog-status` }
				/>
			</div>
			<D.Dialog.Root open={ dialogOpen } onOpenChange={ setDialogOpen }>
				<D.Dialog.Trigger
					data-testid={ `${ prefix }-dialog-trigger` }
					style={ { padding: '8px 16px' } }
				>
					Open Dialog
				</D.Dialog.Trigger>
				<D.Dialog.Portal>
					<D.Dialog.Backdrop style={ backdropStyle } />
					<D.Dialog.Popup
						data-testid={ `${ prefix }-dialog-popup` }
						style={ dialogPopupStyle }
					>
						<h4 style={ { margin: '0 0 12px' } }>Dialog</h4>
						<S.Select.Root defaultValue="Apple">
							<S.Select.Trigger
								data-testid={ `${ prefix }-select-trigger` }
								style={ selectTriggerStyle }
							/>
							<S.Select.Portal>
								<S.Select.Positioner>
									<S.Select.Popup
										data-testid={ `${ prefix }-select-popup` }
										style={ selectPopupStyle }
									>
										<SelectItems lib={ S } />
									</S.Select.Popup>
								</S.Select.Positioner>
							</S.Select.Portal>
						</S.Select.Root>
					</D.Dialog.Popup>
				</D.Dialog.Portal>
			</D.Dialog.Root>
		</>
	);
}

function DialogSelectScenario() {
	return (
		<ScenarioCard
			scenarioId="1.1"
			title="Dialog + Select"
			description="Open Dialog, open Select inside it. Click Select popup — Dialog stays open. Click outside — Dialog closes. Escape with Select open — observe."
		>
			<VariantPanel
				testId="1.1-same-bundle"
				label="Same bundle (A + A)"
				isCrossBundleVariant={ false }
			>
				<DialogSelectVariant D={ A } S={ A } prefix="1.1-same-bundle" />
			</VariantPanel>
			<VariantPanel
				testId="1.1-cross-bundle"
				label="Cross bundle (A + B)"
				isCrossBundleVariant
			>
				<DialogSelectVariant
					D={ A }
					S={ B }
					prefix="1.1-cross-bundle"
				/>
			</VariantPanel>
		</ScenarioCard>
	);
}

// ─── 1.2 Popover in Popover ────────────────────────────────────────

function PopoverInPopoverVariant( {
	O,
	I,
	prefix,
}: {
	O: BundleLib;
	I: BundleLib;
	prefix: string;
} ) {
	const [ outerOpen, setOuterOpen ] = React.useState( false );
	const [ innerOpen, setInnerOpen ] = React.useState( false );
	return (
		<>
			<div
				style={ {
					display: 'flex',
					gap: '8px',
					alignItems: 'center',
					marginBottom: '8px',
				} }
			>
				<StatusIndicator
					label="Outer"
					isOpen={ outerOpen }
					testId={ `${ prefix }-outer-status` }
				/>
				<StatusIndicator
					label="Inner"
					isOpen={ innerOpen }
					testId={ `${ prefix }-inner-status` }
				/>
			</div>
			<O.Popover.Root open={ outerOpen } onOpenChange={ setOuterOpen }>
				<O.Popover.Trigger
					data-testid={ `${ prefix }-outer-trigger` }
					style={ { padding: '8px 16px' } }
				>
					Open Outer Popover
				</O.Popover.Trigger>
				<O.Popover.Portal>
					<O.Popover.Positioner>
						<O.Popover.Popup
							data-testid={ `${ prefix }-outer-popup` }
							style={ popupStyle }
						>
							<h4 style={ { margin: '0 0 8px' } }>
								Outer Popover
							</h4>
							<I.Popover.Root
								open={ innerOpen }
								onOpenChange={ setInnerOpen }
							>
								<I.Popover.Trigger
									data-testid={ `${ prefix }-inner-trigger` }
									style={ { padding: '6px 12px' } }
								>
									Open Inner Popover
								</I.Popover.Trigger>
								<I.Popover.Portal>
									<I.Popover.Positioner>
										<I.Popover.Popup
											data-testid={ `${ prefix }-inner-popup` }
											style={ {
												...popupStyle,
												background: '#f0f8ff',
											} }
										>
											<h4
												style={ {
													margin: '0 0 8px',
												} }
											>
												Inner Popover
											</h4>
											<p style={ { margin: 0 } }>
												Press Escape — does only this
												close?
											</p>
										</I.Popover.Popup>
									</I.Popover.Positioner>
								</I.Popover.Portal>
							</I.Popover.Root>
						</O.Popover.Popup>
					</O.Popover.Positioner>
				</O.Popover.Portal>
			</O.Popover.Root>
		</>
	);
}

function PopoverInPopoverScenario() {
	return (
		<ScenarioCard
			scenarioId="1.2"
			title="Popover in Popover"
			description="Open outer Popover, open inner Popover. Click inner — outer stays. Escape — only inner closes."
		>
			<VariantPanel
				testId="1.2-same-bundle"
				label="Same bundle (A + A)"
				isCrossBundleVariant={ false }
			>
				<PopoverInPopoverVariant
					O={ A }
					I={ A }
					prefix="1.2-same-bundle"
				/>
			</VariantPanel>
			<VariantPanel
				testId="1.2-cross-bundle"
				label="Cross bundle (A + B)"
				isCrossBundleVariant
			>
				<PopoverInPopoverVariant
					O={ A }
					I={ B }
					prefix="1.2-cross-bundle"
				/>
			</VariantPanel>
		</ScenarioCard>
	);
}

// ─── 1.3 Three-level nesting ───────────────────────────────────────

function ThreeLevelVariant( {
	D,
	P,
	prefix,
}: {
	D: BundleLib;
	P: BundleLib;
	prefix: string;
} ) {
	const [ dialogOpen, setDialogOpen ] = React.useState( false );
	const [ popoverOpen, setPopoverOpen ] = React.useState( false );
	return (
		<>
			<div
				style={ {
					display: 'flex',
					gap: '8px',
					alignItems: 'center',
					marginBottom: '8px',
				} }
			>
				<StatusIndicator
					label="Dialog"
					isOpen={ dialogOpen }
					testId={ `${ prefix }-dialog-status` }
				/>
				<StatusIndicator
					label="Popover"
					isOpen={ popoverOpen }
					testId={ `${ prefix }-popover-status` }
				/>
			</div>
			<D.Dialog.Root open={ dialogOpen } onOpenChange={ setDialogOpen }>
				<D.Dialog.Trigger
					data-testid={ `${ prefix }-dialog-trigger` }
					style={ { padding: '8px 16px' } }
				>
					Open Dialog
				</D.Dialog.Trigger>
				<D.Dialog.Portal>
					<D.Dialog.Backdrop style={ backdropStyle } />
					<D.Dialog.Popup
						data-testid={ `${ prefix }-dialog-popup` }
						style={ { ...dialogPopupStyle, minWidth: '400px' } }
					>
						<h4 style={ { margin: '0 0 12px' } }>Dialog (outer)</h4>
						<P.Popover.Root
							open={ popoverOpen }
							onOpenChange={ setPopoverOpen }
						>
							<P.Popover.Trigger
								data-testid={ `${ prefix }-popover-trigger` }
								style={ { padding: '6px 12px' } }
							>
								Open Popover (middle)
							</P.Popover.Trigger>
							<P.Popover.Portal>
								<P.Popover.Positioner>
									<P.Popover.Popup
										data-testid={ `${ prefix }-popover-popup` }
										style={ {
											...popupStyle,
											background: '#f0f8ff',
										} }
									>
										<h4
											style={ {
												margin: '0 0 8px',
											} }
										>
											Popover (middle)
										</h4>
										<p>Select below (innermost):</p>
										<D.Select.Root defaultValue="Apple">
											<D.Select.Trigger
												data-testid={ `${ prefix }-select-trigger` }
												style={ selectTriggerStyle }
											/>
											<D.Select.Portal>
												<D.Select.Positioner>
													<D.Select.Popup
														data-testid={ `${ prefix }-select-popup` }
														style={
															selectPopupStyle
														}
													>
														<SelectItems
															lib={ D }
														/>
													</D.Select.Popup>
												</D.Select.Positioner>
											</D.Select.Portal>
										</D.Select.Root>
									</P.Popover.Popup>
								</P.Popover.Positioner>
							</P.Popover.Portal>
						</P.Popover.Root>
					</D.Dialog.Popup>
				</D.Dialog.Portal>
			</D.Dialog.Root>
		</>
	);
}

function ThreeLevelNestingScenario() {
	return (
		<ScenarioCard
			scenarioId="1.3"
			title="Three-level nesting: Dialog + Popover + Select"
			description="Open all three. Click Select — Popover and Dialog stay. Escape closes innermost. Check visual stacking of Select vs Popover."
		>
			<VariantPanel
				testId="1.3-same-bundle"
				label="Same bundle (A + A)"
				isCrossBundleVariant={ false }
			>
				<ThreeLevelVariant D={ A } P={ A } prefix="1.3-same-bundle" />
			</VariantPanel>
			<VariantPanel
				testId="1.3-cross-bundle"
				label="Cross bundle (A + B)"
				isCrossBundleVariant
			>
				<ThreeLevelVariant D={ A } P={ B } prefix="1.3-cross-bundle" />
			</VariantPanel>
		</ScenarioCard>
	);
}

// ─── 1.4 Modal Dialog + Popover ────────────────────────────────────

function ModalDialogPopoverVariant( {
	D,
	P,
	prefix,
}: {
	D: BundleLib;
	P: BundleLib;
	prefix: string;
} ) {
	const [ dialogOpen, setDialogOpen ] = React.useState( false );
	const [ popoverOpen, setPopoverOpen ] = React.useState( false );
	return (
		<>
			<div
				style={ {
					display: 'flex',
					gap: '8px',
					alignItems: 'center',
					marginBottom: '8px',
				} }
			>
				<StatusIndicator
					label="Dialog"
					isOpen={ dialogOpen }
					testId={ `${ prefix }-dialog-status` }
				/>
				<StatusIndicator
					label="Popover"
					isOpen={ popoverOpen }
					testId={ `${ prefix }-popover-status` }
				/>
			</div>
			<D.Dialog.Root
				open={ dialogOpen }
				onOpenChange={ setDialogOpen }
				modal
			>
				<D.Dialog.Trigger
					data-testid={ `${ prefix }-dialog-trigger` }
					style={ { padding: '8px 16px' } }
				>
					Open Modal Dialog
				</D.Dialog.Trigger>
				<D.Dialog.Portal>
					<D.Dialog.Backdrop style={ backdropStyle } />
					<D.Dialog.Popup
						data-testid={ `${ prefix }-dialog-popup` }
						style={ dialogPopupStyle }
					>
						<h4 style={ { margin: '0 0 12px' } }>Modal Dialog</h4>
						<P.Popover.Root
							open={ popoverOpen }
							onOpenChange={ setPopoverOpen }
						>
							<P.Popover.Trigger
								data-testid={ `${ prefix }-popover-trigger` }
								style={ { padding: '6px 12px' } }
							>
								Open Popover
							</P.Popover.Trigger>
							<P.Popover.Portal>
								<P.Popover.Positioner>
									<P.Popover.Popup
										data-testid={ `${ prefix }-popover-popup` }
										style={ {
											...popupStyle,
											background: '#fff8f0',
										} }
									>
										<h4
											style={ {
												margin: '0 0 8px',
											} }
										>
											Popover
										</h4>
										<p style={ { margin: 0 } }>
											I should be visible above the modal.
										</p>
									</P.Popover.Popup>
								</P.Popover.Positioner>
							</P.Popover.Portal>
						</P.Popover.Root>
					</D.Dialog.Popup>
				</D.Dialog.Portal>
			</D.Dialog.Root>
		</>
	);
}

function ModalDialogPopoverScenario() {
	return (
		<ScenarioCard
			scenarioId="1.4"
			title="Modal Dialog + Popover"
			description="Open modal Dialog, open Popover inside. Click Popover — Dialog stays. Backdrop click closes Dialog."
		>
			<VariantPanel
				testId="1.4-same-bundle"
				label="Same bundle (A + A)"
				isCrossBundleVariant={ false }
			>
				<ModalDialogPopoverVariant
					D={ A }
					P={ A }
					prefix="1.4-same-bundle"
				/>
			</VariantPanel>
			<VariantPanel
				testId="1.4-cross-bundle"
				label="Cross bundle (A + B)"
				isCrossBundleVariant
			>
				<ModalDialogPopoverVariant
					D={ A }
					P={ B }
					prefix="1.4-cross-bundle"
				/>
			</VariantPanel>
		</ScenarioCard>
	);
}

// ─── 1.5 Dialog in Dialog ──────────────────────────────────────────

function DialogInDialogVariant( {
	O,
	I,
	prefix,
}: {
	O: BundleLib;
	I: BundleLib;
	prefix: string;
} ) {
	const [ outerOpen, setOuterOpen ] = React.useState( false );
	const [ innerOpen, setInnerOpen ] = React.useState( false );
	return (
		<>
			<div
				style={ {
					display: 'flex',
					gap: '8px',
					alignItems: 'center',
					marginBottom: '8px',
				} }
			>
				<StatusIndicator
					label="Outer Dialog"
					isOpen={ outerOpen }
					testId={ `${ prefix }-outer-status` }
				/>
				<StatusIndicator
					label="Inner Dialog"
					isOpen={ innerOpen }
					testId={ `${ prefix }-inner-status` }
				/>
			</div>
			<O.Dialog.Root open={ outerOpen } onOpenChange={ setOuterOpen }>
				<O.Dialog.Trigger
					data-testid={ `${ prefix }-outer-trigger` }
					style={ { padding: '8px 16px' } }
				>
					Open Outer Dialog
				</O.Dialog.Trigger>
				<O.Dialog.Portal>
					<O.Dialog.Backdrop style={ backdropStyle } />
					<O.Dialog.Popup
						data-testid={ `${ prefix }-outer-popup` }
						style={ dialogPopupStyle }
					>
						<h4 style={ { margin: '0 0 12px' } }>Outer Dialog</h4>
						<I.Dialog.Root
							open={ innerOpen }
							onOpenChange={ setInnerOpen }
						>
							<I.Dialog.Trigger
								data-testid={ `${ prefix }-inner-trigger` }
								style={ { padding: '6px 12px' } }
							>
								Open Inner Dialog
							</I.Dialog.Trigger>
							<I.Dialog.Portal>
								<I.Dialog.Backdrop style={ backdropStyle } />
								<I.Dialog.Popup
									data-testid={ `${ prefix }-inner-popup` }
									style={ {
										...dialogPopupStyle,
										background: '#f0f8ff',
										minWidth: '300px',
									} }
								>
									<h4
										style={ {
											margin: '0 0 8px',
										} }
									>
										Inner Dialog
									</h4>
									<p style={ { margin: 0 } }>
										Press Escape — does only this close?
									</p>
								</I.Dialog.Popup>
							</I.Dialog.Portal>
						</I.Dialog.Root>
					</O.Dialog.Popup>
				</O.Dialog.Portal>
			</O.Dialog.Root>
		</>
	);
}

function DialogInDialogScenario() {
	return (
		<ScenarioCard
			scenarioId="1.5"
			title="Dialog in Dialog"
			description="Open outer Dialog, open inner Dialog. Escape — only inner should close (same-bundle) vs both close (cross-bundle regression)."
		>
			<VariantPanel
				testId="1.5-same-bundle"
				label="Same bundle (A + A)"
				isCrossBundleVariant={ false }
			>
				<DialogInDialogVariant
					O={ A }
					I={ A }
					prefix="1.5-same-bundle"
				/>
			</VariantPanel>
			<VariantPanel
				testId="1.5-cross-bundle"
				label="Cross bundle (A + B)"
				isCrossBundleVariant
			>
				<DialogInDialogVariant
					O={ A }
					I={ B }
					prefix="1.5-cross-bundle"
				/>
			</VariantPanel>
		</ScenarioCard>
	);
}

// ─── 2.1 Legacy Modal + Base UI Select ──────────────────────────────

function LegacyModalSelectVariant( {
	lib,
	prefix,
}: {
	lib: BundleLib;
	prefix: string;
} ) {
	const [ modalOpen, setModalOpen ] = React.useState( false );
	if ( ! LegacyModal ) {
		return <p>wp.components.Modal not available</p>;
	}
	return (
		<>
			<div
				style={ {
					display: 'flex',
					gap: '8px',
					alignItems: 'center',
					marginBottom: '8px',
				} }
			>
				<StatusIndicator
					label="Modal"
					isOpen={ modalOpen }
					testId={ `${ prefix }-modal-status` }
				/>
			</div>
			<button
				data-testid={ `${ prefix }-modal-trigger` }
				onClick={ () => setModalOpen( true ) }
				style={ { padding: '8px 16px' } }
			>
				Open Legacy Modal
			</button>
			{ modalOpen && (
				<LegacyModal
					title="Legacy Modal"
					onRequestClose={ () => setModalOpen( false ) }
				>
					<div data-testid={ `${ prefix }-modal-body` }>
						<p>
							Select below is from Base UI (simulating
							@wordpress/ui):
						</p>
						<lib.Select.Root defaultValue="Apple">
							<lib.Select.Trigger
								data-testid={ `${ prefix }-select-trigger` }
								style={ selectTriggerStyle }
							/>
							<lib.Select.Portal>
								<lib.Select.Positioner>
									<lib.Select.Popup
										data-testid={ `${ prefix }-select-popup` }
										style={ selectPopupStyle }
									>
										<SelectItems lib={ lib } />
									</lib.Select.Popup>
								</lib.Select.Positioner>
							</lib.Select.Portal>
						</lib.Select.Root>
					</div>
				</LegacyModal>
			) }
		</>
	);
}

function LegacyModalSelectScenario() {
	return (
		<ScenarioCard
			scenarioId="2.1"
			title="Legacy Modal + Base UI Select"
			description="Open @wordpress/components Modal, open Base UI Select inside. Click Select — Modal stays. Escape with Select open — observe."
		>
			<VariantPanel
				testId="2.1-same-bundle"
				label="Both from Bundle A"
				isCrossBundleVariant={ false }
			>
				<LegacyModalSelectVariant lib={ A } prefix="2.1-same-bundle" />
			</VariantPanel>
			<VariantPanel
				testId="2.1-cross-bundle"
				label="Modal=legacy, Select=Bundle B"
				isCrossBundleVariant
			>
				<LegacyModalSelectVariant lib={ B } prefix="2.1-cross-bundle" />
			</VariantPanel>
		</ScenarioCard>
	);
}

// ─── 2.2 Base UI Dialog + Legacy Popover ────────────────────────────

function DialogLegacyPopoverVariant( {
	D,
	prefix,
}: {
	D: BundleLib;
	prefix: string;
} ) {
	const [ dialogOpen, setDialogOpen ] = React.useState( false );
	const [ popoverAnchor, setPopoverAnchor ] = React.useState( null );
	const [ showPopover, setShowPopover ] = React.useState( false );
	if ( ! LegacyPopover ) {
		return <p>wp.components.Popover not available</p>;
	}
	return (
		<>
			<div
				style={ {
					display: 'flex',
					gap: '8px',
					alignItems: 'center',
					marginBottom: '8px',
				} }
			>
				<StatusIndicator
					label="Dialog"
					isOpen={ dialogOpen }
					testId={ `${ prefix }-dialog-status` }
				/>
				<StatusIndicator
					label="Popover"
					isOpen={ showPopover }
					testId={ `${ prefix }-popover-status` }
				/>
			</div>
			<D.Dialog.Root open={ dialogOpen } onOpenChange={ setDialogOpen }>
				<D.Dialog.Trigger
					data-testid={ `${ prefix }-dialog-trigger` }
					style={ { padding: '8px 16px' } }
				>
					Open Dialog
				</D.Dialog.Trigger>
				<D.Dialog.Portal>
					<D.Dialog.Backdrop style={ backdropStyle } />
					<D.Dialog.Popup
						data-testid={ `${ prefix }-dialog-popup` }
						style={ dialogPopupStyle }
					>
						<h4 style={ { margin: '0 0 12px' } }>Base UI Dialog</h4>
						<button
							ref={ setPopoverAnchor }
							data-testid={ `${ prefix }-popover-trigger` }
							onClick={ () => setShowPopover( ! showPopover ) }
							style={ { padding: '6px 12px' } }
						>
							Toggle Legacy Popover
						</button>
						{ showPopover && (
							<LegacyPopover
								anchor={ popoverAnchor }
								onClose={ () => setShowPopover( false ) }
							>
								<div
									data-testid={ `${ prefix }-popover-popup` }
									style={ { padding: '16px' } }
								>
									<p style={ { margin: '0 0 8px' } }>
										Legacy Popover content.
									</p>
									<button
										data-testid={ `${ prefix }-popover-action` }
										style={ { padding: '4px 8px' } }
									>
										Focusable action
									</button>
								</div>
							</LegacyPopover>
						) }
					</D.Dialog.Popup>
				</D.Dialog.Portal>
			</D.Dialog.Root>
		</>
	);
}

function DialogLegacyPopoverScenario() {
	return (
		<ScenarioCard
			scenarioId="2.2"
			title="Base UI Dialog + Legacy Popover"
			description="Open Base UI Dialog, toggle @wordpress/components Popover inside. Click Popover — Dialog stays. Escape — observe."
		>
			<VariantPanel
				testId="2.2-same-bundle"
				label="Dialog from Bundle A"
				isCrossBundleVariant={ false }
			>
				<DialogLegacyPopoverVariant D={ A } prefix="2.2-same-bundle" />
			</VariantPanel>
			<VariantPanel
				testId="2.2-cross-bundle"
				label="Dialog from Bundle B"
				isCrossBundleVariant
			>
				<DialogLegacyPopoverVariant D={ B } prefix="2.2-cross-bundle" />
			</VariantPanel>
		</ScenarioCard>
	);
}

// ─── 2.3 Legacy Modal + Base UI Dialog + Base UI Select ─────────────

function ThreeLevelInteropVariant( {
	D,
	prefix,
}: {
	D: BundleLib;
	prefix: string;
} ) {
	const [ modalOpen, setModalOpen ] = React.useState( false );
	const [ dialogOpen, setDialogOpen ] = React.useState( false );
	if ( ! LegacyModal ) {
		return <p>wp.components.Modal not available</p>;
	}
	return (
		<>
			<div
				style={ {
					display: 'flex',
					gap: '8px',
					alignItems: 'center',
					marginBottom: '8px',
				} }
			>
				<StatusIndicator
					label="Modal"
					isOpen={ modalOpen }
					testId={ `${ prefix }-modal-status` }
				/>
				<StatusIndicator
					label="Dialog"
					isOpen={ dialogOpen }
					testId={ `${ prefix }-dialog-status` }
				/>
			</div>
			<button
				data-testid={ `${ prefix }-modal-trigger` }
				onClick={ () => setModalOpen( true ) }
				style={ { padding: '8px 16px' } }
			>
				Open Legacy Modal
			</button>
			{ modalOpen && (
				<LegacyModal
					title="Legacy Modal (outer)"
					onRequestClose={ () => setModalOpen( false ) }
				>
					<div data-testid={ `${ prefix }-modal-body` }>
						<D.Dialog.Root
							open={ dialogOpen }
							onOpenChange={ setDialogOpen }
						>
							<D.Dialog.Trigger
								data-testid={ `${ prefix }-dialog-trigger` }
								style={ { padding: '6px 12px' } }
							>
								Open Base UI Dialog (middle)
							</D.Dialog.Trigger>
							<D.Dialog.Portal>
								<D.Dialog.Backdrop style={ backdropStyle } />
								<D.Dialog.Popup
									data-testid={ `${ prefix }-dialog-popup` }
									style={ {
										...dialogPopupStyle,
										minWidth: '350px',
									} }
								>
									<h4 style={ { margin: '0 0 12px' } }>
										Base UI Dialog (middle)
									</h4>
									<p>Select below (innermost):</p>
									<D.Select.Root defaultValue="Apple">
										<D.Select.Trigger
											data-testid={ `${ prefix }-select-trigger` }
											style={ selectTriggerStyle }
										/>
										<D.Select.Portal>
											<D.Select.Positioner>
												<D.Select.Popup
													data-testid={ `${ prefix }-select-popup` }
													style={ selectPopupStyle }
												>
													<SelectItems lib={ D } />
												</D.Select.Popup>
											</D.Select.Positioner>
										</D.Select.Portal>
									</D.Select.Root>
								</D.Dialog.Popup>
							</D.Dialog.Portal>
						</D.Dialog.Root>
					</div>
				</LegacyModal>
			) }
		</>
	);
}

function ThreeLevelInteropScenario() {
	return (
		<ScenarioCard
			scenarioId="2.3"
			title="Legacy Modal + Base UI Dialog + Base UI Select"
			description="Three levels mixing both systems. Open all three. Escape cascades correctly? Click-outside handled properly?"
		>
			<VariantPanel
				testId="2.3-same-bundle"
				label="All Base UI from Bundle A"
				isCrossBundleVariant={ false }
			>
				<ThreeLevelInteropVariant D={ A } prefix="2.3-same-bundle" />
			</VariantPanel>
			<VariantPanel
				testId="2.3-cross-bundle"
				label="Base UI from Bundle B"
				isCrossBundleVariant
			>
				<ThreeLevelInteropVariant D={ B } prefix="2.3-cross-bundle" />
			</VariantPanel>
		</ScenarioCard>
	);
}

// ─── App ────────────────────────────────────────────────────────────

function App() {
	return (
		<div style={ { maxWidth: '1100px' } }>
			<p style={ { color: '#666' } }>
				Each scenario is rendered twice: <strong>Same bundle</strong>{ ' ' }
				(both components from bundle A) and{ ' ' }
				<strong>Cross bundle</strong> (outer from A, inner from B).
				Compare behavior side by side.
			</p>

			<h2>Dismiss Coordination</h2>
			<DialogSelectScenario />
			<PopoverInPopoverScenario />
			<ThreeLevelNestingScenario />
			<ModalDialogPopoverScenario />
			<DialogInDialogScenario />

			<h2>Legacy Interop (@wordpress/components)</h2>
			<p style={ { color: '#666' } }>
				These scenarios mix <code>@wordpress/components</code> overlays
				(Modal, Popover) with Base UI overlays (simulating{ ' ' }
				<code>@wordpress/ui</code>). This tests the real migration
				scenario where both systems coexist.
			</p>
			<LegacyModalSelectScenario />
			<DialogLegacyPopoverScenario />
			<ThreeLevelInteropScenario />

			<h2>Focus Management</h2>
			<p style={ { color: '#666' } }>
				Use the scenarios above to test Tab cycling, focus trapping, and
				focus restoration. Open an overlay, press Tab to cycle focus,
				then close it and verify focus returns to the trigger.
			</p>
		</div>
	);
}

const rootEl = document.getElementById( 'overlay-dismiss-stress-test-root' );
if ( rootEl ) {
	const root = ReactDOM.createRoot( rootEl );
	root.render( React.createElement( App ) );
}

/* eslint-enable jsdoc/require-param */
