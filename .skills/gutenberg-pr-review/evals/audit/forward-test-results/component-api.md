# Component API

## Must fix

- `packages/components/src/sandbox/index.tsx:364` — Changing `allowPopups` after mount only updates the iframe attribute; browsers apply sandbox flags when the iframe navigates, so the active document retains its original popup permission. This also affects the same-origin path at line 533: enabling the prop does not enable popups until a later navigation, while disabling it does not reliably revoke permission. Remount or navigate the iframe whenever the sandbox policy changes, and add browser-level coverage for both enabling and revoking the permission.
