/**
 * Cross-bundle overlay dismiss stress test playground.
 *
 * Renders test scenarios using two independent @base-ui/react bundles
 * (window.OverlayBundleA and window.OverlayBundleB) alongside a shared
 * React instance.
 */

const React = ( window as any ).React;
const ReactDOM = ( window as any ).ReactDOM;

const A = ( window as any ).OverlayBundleA;
const B = ( window as any ).OverlayBundleB;

function StatusIndicator( {
	label,
	isOpen,
}: {
	label: string;
	isOpen: boolean;
} ) {
	return (
		<span
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

function ScenarioCard( {
	title,
	scenarioId,
	description,
	children,
}: {
	title: string;
	scenarioId: string;
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
			{ children }
		</div>
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

function SelectItems( { lib }: { lib: typeof A } ) {
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

function CrossBundleDialogSelect() {
	const [ dialogOpen, setDialogOpen ] = React.useState( false );
	return (
		<ScenarioCard
			scenarioId="1.1"
			title="Cross-bundle click-outside: Dialog(A) + Select(B)"
			description="Click the Select popup — Dialog should stay open. Click outside both — Dialog should close."
		>
			<div
				style={ {
					display: 'flex',
					gap: '8px',
					alignItems: 'center',
					marginBottom: '8px',
				} }
			>
				<StatusIndicator label="Dialog(A)" isOpen={ dialogOpen } />
			</div>
			<A.Dialog.Root open={ dialogOpen } onOpenChange={ setDialogOpen }>
				<A.Dialog.Trigger style={ { padding: '8px 16px' } }>
					Open Dialog (Bundle A)
				</A.Dialog.Trigger>
				<A.Dialog.Portal>
					<A.Dialog.Backdrop style={ backdropStyle } />
					<A.Dialog.Popup style={ dialogPopupStyle }>
						<h4 style={ { margin: '0 0 12px' } }>
							Dialog from Bundle A
						</h4>
						<p>
							Select below is from <strong>Bundle B</strong>:
						</p>
						<B.Select.Root defaultValue="Apple">
							<B.Select.Trigger style={ selectTriggerStyle } />
							<B.Select.Portal>
								<B.Select.Positioner>
									<B.Select.Popup style={ selectPopupStyle }>
										<SelectItems lib={ B } />
									</B.Select.Popup>
								</B.Select.Positioner>
							</B.Select.Portal>
						</B.Select.Root>
					</A.Dialog.Popup>
				</A.Dialog.Portal>
			</A.Dialog.Root>
		</ScenarioCard>
	);
}

function CrossBundleReversed() {
	const [ dialogOpen, setDialogOpen ] = React.useState( false );
	return (
		<ScenarioCard
			scenarioId="1.2"
			title="Cross-bundle reversed: Dialog(B) + Select(A)"
			description="Same as 1.1 but bundle sources are reversed."
		>
			<div
				style={ {
					display: 'flex',
					gap: '8px',
					alignItems: 'center',
					marginBottom: '8px',
				} }
			>
				<StatusIndicator label="Dialog(B)" isOpen={ dialogOpen } />
			</div>
			<B.Dialog.Root open={ dialogOpen } onOpenChange={ setDialogOpen }>
				<B.Dialog.Trigger style={ { padding: '8px 16px' } }>
					Open Dialog (Bundle B)
				</B.Dialog.Trigger>
				<B.Dialog.Portal>
					<B.Dialog.Backdrop style={ backdropStyle } />
					<B.Dialog.Popup style={ dialogPopupStyle }>
						<h4 style={ { margin: '0 0 12px' } }>
							Dialog from Bundle B
						</h4>
						<p>
							Select below is from <strong>Bundle A</strong>:
						</p>
						<A.Select.Root defaultValue="Apple">
							<A.Select.Trigger style={ selectTriggerStyle } />
							<A.Select.Portal>
								<A.Select.Positioner>
									<A.Select.Popup style={ selectPopupStyle }>
										<SelectItems lib={ A } />
									</A.Select.Popup>
								</A.Select.Positioner>
							</A.Select.Portal>
						</A.Select.Root>
					</B.Dialog.Popup>
				</B.Dialog.Portal>
			</B.Dialog.Root>
		</ScenarioCard>
	);
}

function SameBundleBaseline() {
	const [ dialogOpen, setDialogOpen ] = React.useState( false );
	return (
		<ScenarioCard
			scenarioId="1.3"
			title="Same-bundle baseline: Dialog(A) + Select(A)"
			description="Both from same bundle. This is the expected-behavior reference."
		>
			<div
				style={ {
					display: 'flex',
					gap: '8px',
					alignItems: 'center',
					marginBottom: '8px',
				} }
			>
				<StatusIndicator label="Dialog(A)" isOpen={ dialogOpen } />
			</div>
			<A.Dialog.Root open={ dialogOpen } onOpenChange={ setDialogOpen }>
				<A.Dialog.Trigger style={ { padding: '8px 16px' } }>
					Open Dialog (Bundle A)
				</A.Dialog.Trigger>
				<A.Dialog.Portal>
					<A.Dialog.Backdrop style={ backdropStyle } />
					<A.Dialog.Popup style={ dialogPopupStyle }>
						<h4 style={ { margin: '0 0 12px' } }>
							Dialog from Bundle A
						</h4>
						<p>
							Select below is also from <strong>Bundle A</strong>:
						</p>
						<A.Select.Root defaultValue="Apple">
							<A.Select.Trigger style={ selectTriggerStyle } />
							<A.Select.Portal>
								<A.Select.Positioner>
									<A.Select.Popup style={ selectPopupStyle }>
										<SelectItems lib={ A } />
									</A.Select.Popup>
								</A.Select.Positioner>
							</A.Select.Portal>
						</A.Select.Root>
					</A.Dialog.Popup>
				</A.Dialog.Portal>
			</A.Dialog.Root>
		</ScenarioCard>
	);
}

function PopoverInPopover() {
	const [ outerOpen, setOuterOpen ] = React.useState( false );
	const [ innerOpen, setInnerOpen ] = React.useState( false );
	return (
		<ScenarioCard
			scenarioId="1.5"
			title="Popover-in-Popover: Popover(A) + Popover(B)"
			description="Click inner popup — outer stays open. Test Escape: does only inner close?"
		>
			<div
				style={ {
					display: 'flex',
					gap: '8px',
					alignItems: 'center',
					marginBottom: '8px',
				} }
			>
				<StatusIndicator label="Outer(A)" isOpen={ outerOpen } />
				<StatusIndicator label="Inner(B)" isOpen={ innerOpen } />
			</div>
			<A.Popover.Root open={ outerOpen } onOpenChange={ setOuterOpen }>
				<A.Popover.Trigger style={ { padding: '8px 16px' } }>
					Open Outer Popover (A)
				</A.Popover.Trigger>
				<A.Popover.Portal>
					<A.Popover.Positioner>
						<A.Popover.Popup style={ popupStyle }>
							<h4 style={ { margin: '0 0 8px' } }>
								Outer Popover (Bundle A)
							</h4>
							<B.Popover.Root
								open={ innerOpen }
								onOpenChange={ setInnerOpen }
							>
								<B.Popover.Trigger
									style={ { padding: '6px 12px' } }
								>
									Open Inner Popover (B)
								</B.Popover.Trigger>
								<B.Popover.Portal>
									<B.Popover.Positioner>
										<B.Popover.Popup
											style={ {
												...popupStyle,
												background: '#f0f8ff',
											} }
										>
											<h4 style={ { margin: '0 0 8px' } }>
												Inner Popover (Bundle B)
											</h4>
											<p style={ { margin: 0 } }>
												Press Escape — does only this
												close?
											</p>
										</B.Popover.Popup>
									</B.Popover.Positioner>
								</B.Popover.Portal>
							</B.Popover.Root>
						</A.Popover.Popup>
					</A.Popover.Positioner>
				</A.Popover.Portal>
			</A.Popover.Root>
		</ScenarioCard>
	);
}

function ThreeLevelNesting() {
	const [ dialogOpen, setDialogOpen ] = React.useState( false );
	const [ popoverOpen, setPopoverOpen ] = React.useState( false );
	return (
		<ScenarioCard
			scenarioId="1.6"
			title="Three-level nesting: Dialog(A) + Popover(B) + Select(A)"
			description="Click innermost Select — middle Popover and outer Dialog stay open."
		>
			<div
				style={ {
					display: 'flex',
					gap: '8px',
					alignItems: 'center',
					marginBottom: '8px',
				} }
			>
				<StatusIndicator label="Dialog(A)" isOpen={ dialogOpen } />
				<StatusIndicator label="Popover(B)" isOpen={ popoverOpen } />
			</div>
			<A.Dialog.Root open={ dialogOpen } onOpenChange={ setDialogOpen }>
				<A.Dialog.Trigger style={ { padding: '8px 16px' } }>
					Open Dialog (A)
				</A.Dialog.Trigger>
				<A.Dialog.Portal>
					<A.Dialog.Backdrop style={ backdropStyle } />
					<A.Dialog.Popup
						style={ { ...dialogPopupStyle, minWidth: '400px' } }
					>
						<h4 style={ { margin: '0 0 12px' } }>
							Dialog (Bundle A)
						</h4>
						<B.Popover.Root
							open={ popoverOpen }
							onOpenChange={ setPopoverOpen }
						>
							<B.Popover.Trigger
								style={ { padding: '6px 12px' } }
							>
								Open Popover (B)
							</B.Popover.Trigger>
							<B.Popover.Portal>
								<B.Popover.Positioner>
									<B.Popover.Popup
										style={ {
											...popupStyle,
											background: '#f0f8ff',
										} }
									>
										<h4 style={ { margin: '0 0 8px' } }>
											Popover (Bundle B)
										</h4>
										<p>
											Select below is from{ ' ' }
											<strong>Bundle A</strong>:
										</p>
										<A.Select.Root defaultValue="Apple">
											<A.Select.Trigger
												style={ selectTriggerStyle }
											/>
											<A.Select.Portal>
												<A.Select.Positioner>
													<A.Select.Popup
														style={
															selectPopupStyle
														}
													>
														<SelectItems
															lib={ A }
														/>
													</A.Select.Popup>
												</A.Select.Positioner>
											</A.Select.Portal>
										</A.Select.Root>
									</B.Popover.Popup>
								</B.Popover.Positioner>
							</B.Popover.Portal>
						</B.Popover.Root>
					</A.Dialog.Popup>
				</A.Dialog.Portal>
			</A.Dialog.Root>
		</ScenarioCard>
	);
}

function ModalDialogWithPopover() {
	const [ dialogOpen, setDialogOpen ] = React.useState( false );
	const [ popoverOpen, setPopoverOpen ] = React.useState( false );
	return (
		<ScenarioCard
			scenarioId="1.7"
			title="Modal Dialog(A) + non-modal Popover(B)"
			description="Click Popover popup — Dialog stays open. Backdrop click closes Dialog only."
		>
			<div
				style={ {
					display: 'flex',
					gap: '8px',
					alignItems: 'center',
					marginBottom: '8px',
				} }
			>
				<StatusIndicator label="Dialog(A)" isOpen={ dialogOpen } />
				<StatusIndicator label="Popover(B)" isOpen={ popoverOpen } />
			</div>
			<A.Dialog.Root
				open={ dialogOpen }
				onOpenChange={ setDialogOpen }
				modal
			>
				<A.Dialog.Trigger style={ { padding: '8px 16px' } }>
					Open Modal Dialog (A)
				</A.Dialog.Trigger>
				<A.Dialog.Portal>
					<A.Dialog.Backdrop style={ backdropStyle } />
					<A.Dialog.Popup style={ dialogPopupStyle }>
						<h4 style={ { margin: '0 0 12px' } }>
							Modal Dialog (Bundle A)
						</h4>
						<B.Popover.Root
							open={ popoverOpen }
							onOpenChange={ setPopoverOpen }
						>
							<B.Popover.Trigger
								style={ { padding: '6px 12px' } }
							>
								Open Popover (B)
							</B.Popover.Trigger>
							<B.Popover.Portal>
								<B.Popover.Positioner>
									<B.Popover.Popup
										style={ {
											...popupStyle,
											background: '#fff8f0',
										} }
									>
										<h4 style={ { margin: '0 0 8px' } }>
											Popover (Bundle B)
										</h4>
										<p style={ { margin: 0 } }>
											I should be visible above the modal
											dialog.
										</p>
									</B.Popover.Popup>
								</B.Popover.Positioner>
							</B.Popover.Portal>
						</B.Popover.Root>
					</A.Dialog.Popup>
				</A.Dialog.Portal>
			</A.Dialog.Root>
		</ScenarioCard>
	);
}

function App() {
	return (
		<div style={ { maxWidth: '800px' } }>
			<h2>Concern 1: Dismiss Coordination Across Bundles</h2>
			<p style={ { color: '#666' } }>
				Bundle A and Bundle B each contain an independent copy of{ ' ' }
				<code>@base-ui/react</code> with separate React contexts. They
				share the same React instance.
			</p>
			<CrossBundleDialogSelect />
			<CrossBundleReversed />
			<SameBundleBaseline />
			<PopoverInPopover />
			<ThreeLevelNesting />
			<ModalDialogWithPopover />

			<h2>Concern 4: Focus Management Across Bundles</h2>
			<p style={ { color: '#666' } }>
				Test tab navigation, focus trapping, and focus restoration with
				cross-bundle overlays. Use the scenarios above — open a Dialog,
				then a Select or Popover inside it, and test Tab key cycling and
				focus restoration on close.
			</p>
		</div>
	);
}

const rootEl = document.getElementById( 'overlay-dismiss-stress-test-root' );
if ( rootEl ) {
	const root = ReactDOM.createRoot( rootEl );
	root.render( React.createElement( App ) );
}
