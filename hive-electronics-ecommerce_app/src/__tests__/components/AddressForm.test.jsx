/**
 * Unit tests — AddressForm component
 *
 * AddressForm renders all address fields, calls onSubmit with form data,
 * and resets after submit when not in edit mode.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AddressForm from '../../components/Checkout/Address/AddressForm';

const VALID_ADDRESS = {
  name: 'Home',
  address1: '123 Main St',
  address2: 'Apt 4',
  postalCode: '10001',
  city: 'New York',
  country: 'US',
  reference: 'Near park',
};

const fillForm = (overrides = {}) => {
  const data = { ...VALID_ADDRESS, ...overrides };
  fireEvent.change(screen.getByLabelText('Address name'), { target: { value: data.name } });
  fireEvent.change(screen.getByLabelText('Address line 1'), { target: { value: data.address1 } });
  if (data.address2) {
    fireEvent.change(screen.getByLabelText('Address line 2'), { target: { value: data.address2 } });
  }
  fireEvent.change(screen.getByLabelText('Zip code'), { target: { value: data.postalCode } });
  fireEvent.change(screen.getByLabelText('City'), { target: { value: data.city } });
  fireEvent.change(screen.getByLabelText('Country'), { target: { value: data.country } });
};

const renderForm = (props = {}) =>
  render(
    <MemoryRouter>
      <AddressForm onSubmit={vi.fn()} onCancel={vi.fn()} {...props} />
    </MemoryRouter>
  );

// ── rendering ─────────────────────────────────────────────────────────────────
describe('AddressForm — rendering', () => {
  it('TC-UNIT-FE-079 — renders all required input fields', () => {
    renderForm();
    expect(screen.getByLabelText('Address name')).toBeInTheDocument();
    expect(screen.getByLabelText('Address line 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Zip code')).toBeInTheDocument();
    expect(screen.getByLabelText('City')).toBeInTheDocument();
    expect(screen.getByLabelText('Country')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-080 — shows "New address" title when isEdit is false', () => {
    renderForm({ isEdit: false });
    expect(screen.getByText('New address')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-081 — shows "Edit address" title when isEdit is true', () => {
    renderForm({ isEdit: true, initialValues: VALID_ADDRESS });
    expect(screen.getByText('Edit address')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-082 — "Add address" submit button in create mode', () => {
    renderForm({ isEdit: false });
    expect(screen.getByRole('button', { name: 'Add address' })).toBeInTheDocument();
  });

  it('TC-UNIT-FE-083 — "Save changes" submit button in edit mode', () => {
    renderForm({ isEdit: true, initialValues: VALID_ADDRESS });
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('TC-UNIT-FE-084 — Cancel button is rendered when onCancel is provided', () => {
    renderForm();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('TC-UNIT-FE-085 — fields pre-populated when initialValues provided', () => {
    renderForm({ initialValues: VALID_ADDRESS });
    expect(screen.getByLabelText('Address name')).toHaveValue('Home');
    expect(screen.getByLabelText('City')).toHaveValue('New York');
  });
});

// ── submission ────────────────────────────────────────────────────────────────
describe('AddressForm — submission', () => {
  it('TC-UNIT-FE-086 — calls onSubmit with form data on submit', () => {
    const onSubmit = vi.fn();
    render(
      <MemoryRouter>
        <AddressForm onSubmit={onSubmit} onCancel={vi.fn()} />
      </MemoryRouter>
    );

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Add address' }));

    expect(onSubmit).toHaveBeenCalledOnce();
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.name).toBe('Home');
    expect(submitted.address1).toBe('123 Main St');
    expect(submitted.postalCode).toBe('10001');
    expect(submitted.city).toBe('New York');
    expect(submitted.country).toBe('US');
  });

  it('TC-UNIT-FE-087 — calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <MemoryRouter>
        <AddressForm onSubmit={vi.fn()} onCancel={onCancel} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('TC-UNIT-FE-088 — form resets after new address submit (isEdit:false)', () => {
    const onSubmit = vi.fn();
    render(
      <MemoryRouter>
        <AddressForm onSubmit={onSubmit} onCancel={vi.fn()} isEdit={false} />
      </MemoryRouter>
    );

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Add address' }));

    // After reset, fields should be empty
    expect(screen.getByLabelText('Address name')).toHaveValue('');
    expect(screen.getByLabelText('City')).toHaveValue('');
  });
});
