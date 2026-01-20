# DataForm vs Field Components: Decision for Login Form

## Overview

This document explains why the login form component uses `Field` + `Input` + `Button` components from `@wordpress/ui` rather than the `DataForm` component from `@wordpress/dataviews`.

## Decision: Not Using DataForm

**DataForm is not suitable for a login form** for the following reasons:

### 1. Simplicity

Login forms are simple, typically containing only 2-3 fields (username/email, password, and optionally "remember me"). DataForm is designed for complex data editing scenarios with many fields, complex validation rules, and advanced layouts.

### 2. Data Model Mismatch

DataForm expects a data object to edit and provides an `onChange` callback for incremental updates. Login forms submit directly via form submission and don't follow a "edit data object" pattern.

### 3. Layout Needs

Login forms require a simple vertical layout with fields stacked on top of each other. DataForm offers complex layouts (panel, card, row, details) that are unnecessary overhead for this use case.

### 4. Validation Complexity

While DataForm provides advanced validation features (async validation, complex rules, field dependencies), login forms only need basic HTML5 validation and simple client-side checks.

### 5. Purpose

DataForm is designed for CRUD operations on data items (like editing posts, media, or other entities). Login is an action/authentication flow, not a data editing operation.

## Decision Criteria for Form Component Selection

### Use `DataForm` when:

- Editing structured data objects (posts, media, settings, etc.)
- Need complex field layouts (panels, cards, grouped fields)
- Require advanced validation (async, cross-field validation)
- Building admin interfaces for data management
- Fields have visibility rules based on other field values

### Use `Field` + `Input` + `Button` (as in this component) when:

- Simple forms with direct submission (login, contact, search)
- Standard HTML form behavior is sufficient
- Simple validation requirements
- No need for complex layouts or field grouping
- Form is an action/flow rather than data editing

## Implementation Notes

The login form uses:

- `Field` components for accessible form structure
- `Input` components for text and password inputs
- `Button` component for form submission
- `Stack` component for vertical layout
- `Box` component for container styling
- Design System tokens for consistent styling

This approach provides a clean, accessible, and maintainable solution that aligns with WordPress Design System patterns while avoiding unnecessary complexity.
