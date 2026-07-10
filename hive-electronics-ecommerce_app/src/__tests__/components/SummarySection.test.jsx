/**
 * Unit tests — SummarySection component
 *
 * Covers:
 *   - Title always rendered
 *   - Expanded state: children shown, summaryContent/Change button hidden, badge hidden
 *   - Collapsed + selected state: summaryContent shown, Change button shown, check badge shown
 *   - Collapsed + not selected state: summaryContent hidden, Change button hidden, badge hidden
 *   - onToggle callback: clicking the header area (not a button) triggers onToggle
 *   - onToggle NOT called when a button inside header area is clicked
 *   - Children only rendered when isExpanded is true
 *
 * SummarySection is a pure presentational component with no services or context.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SummarySection from '../../components/Checkout/SummarySection/SummarySection';

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderSection = (props = {}) =>
  render(
    <SummarySection
      title="Shipping address"
      selected={false}
      summaryContent={<span>123 Main St</span>}
      isExpanded={false}
      onToggle={vi.fn()}
      {...props}
    />
  );

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SummarySection — title', () => {
  it('TC-UNIT-FE-SUMMARY-001 — always renders the title', () => {
    // Arrange + Act
    renderSection();

    // Assert
    expect(screen.getByRole('heading', { name: 'Shipping address' })).toBeInTheDocument();
  });

  it('TC-UNIT-FE-SUMMARY-002 — renders a different title when provided', () => {
    // Arrange + Act
    renderSection({ title: 'Payment method' });

    // Assert
    expect(screen.getByRole('heading', { name: 'Payment method' })).toBeInTheDocument();
  });
});

describe('SummarySection — expanded state', () => {
  it('TC-UNIT-FE-SUMMARY-003 — renders children when isExpanded is true', () => {
    // Arrange + Act
    renderSection({
      isExpanded: true,
      children: <p>Expanded child content</p>,
    });

    // Assert
    expect(screen.getByText('Expanded child content')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-SUMMARY-004 — does NOT render summaryContent when isExpanded is true', () => {
    // Arrange + Act
    renderSection({
      isExpanded: true,
      selected: true,
      summaryContent: <span>123 Main St</span>,
    });

    // Assert
    expect(screen.queryByText('123 Main St')).not.toBeInTheDocument();
  });

  it('TC-UNIT-FE-SUMMARY-005 — does NOT render "Change" button when isExpanded is true', () => {
    // Arrange + Act
    renderSection({
      isExpanded: true,
      selected: true,
    });

    // Assert
    expect(screen.queryByRole('button', { name: /change/i })).not.toBeInTheDocument();
  });

  it('TC-UNIT-FE-SUMMARY-006 — does NOT render the check badge when isExpanded is true', () => {
    // Arrange + Act
    renderSection({
      isExpanded: true,
      selected: true,
    });

    // Assert
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });
});

describe('SummarySection — collapsed + selected state', () => {
  it('TC-UNIT-FE-SUMMARY-007 — renders summaryContent when collapsed and selected', () => {
    // Arrange + Act
    renderSection({
      isExpanded: false,
      selected: true,
      summaryContent: <span>123 Main St</span>,
    });

    // Assert
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-SUMMARY-008 — renders "Change" button when collapsed and selected', () => {
    // Arrange + Act
    renderSection({
      isExpanded: false,
      selected: true,
    });

    // Assert
    expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
  });

  it('TC-UNIT-FE-SUMMARY-009 — renders check badge (✓) when collapsed and selected', () => {
    // Arrange + Act
    renderSection({
      isExpanded: false,
      selected: true,
    });

    // Assert
    expect(screen.getByText('✓')).toBeInTheDocument();
  });
});

describe('SummarySection — collapsed + not selected state', () => {
  it('TC-UNIT-FE-SUMMARY-010 — does NOT render summaryContent when collapsed and not selected', () => {
    // Arrange + Act
    renderSection({
      isExpanded: false,
      selected: false,
      summaryContent: <span>123 Main St</span>,
    });

    // Assert
    expect(screen.queryByText('123 Main St')).not.toBeInTheDocument();
  });

  it('TC-UNIT-FE-SUMMARY-011 — does NOT render "Change" button when collapsed and not selected', () => {
    // Arrange + Act
    renderSection({
      isExpanded: false,
      selected: false,
    });

    // Assert
    expect(screen.queryByRole('button', { name: /change/i })).not.toBeInTheDocument();
  });

  it('TC-UNIT-FE-SUMMARY-012 — does NOT render check badge when collapsed and not selected', () => {
    // Arrange + Act
    renderSection({
      isExpanded: false,
      selected: false,
    });

    // Assert
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });

  it('TC-UNIT-FE-SUMMARY-013 — does NOT render children when isExpanded is false', () => {
    // Arrange + Act
    renderSection({
      isExpanded: false,
      children: <p>Hidden child content</p>,
    });

    // Assert
    expect(screen.queryByText('Hidden child content')).not.toBeInTheDocument();
  });
});

describe('SummarySection — onToggle interaction', () => {
  it('TC-UNIT-FE-SUMMARY-014 — clicking the header area calls onToggle', () => {
    // Arrange
    const onToggle = vi.fn();
    renderSection({ onToggle });

    // Act — click the h3 title text (not a button)
    userEvent.click(screen.getByRole('heading', { name: 'Shipping address' }));

    // Assert
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('TC-UNIT-FE-SUMMARY-015 — clicking "Change" button does NOT trigger onToggle via header click handler', () => {
    // Arrange
    const onToggle = vi.fn();
    renderSection({
      isExpanded: false,
      selected: true,
      onToggle,
    });

    // Act — click Change button (a button inside the header div)
    userEvent.click(screen.getByRole('button', { name: /change/i }));

    // Assert — onToggle is called by the Change button's own onClick={onToggle},
    // but the header's handleToggle guard prevents a second call from the header.
    // Net result: onToggle called exactly once (by the button's onClick), not twice.
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
