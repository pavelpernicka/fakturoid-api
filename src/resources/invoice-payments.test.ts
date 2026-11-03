import { describe, expect, mock, test } from 'bun:test';
import type { HttpClient } from '../http/http-client.js';
import type { FakturoidAuth } from '../types/common.js';
import { InvoicePaymentsResource } from './invoice-payments.js';

describe('InvoicePaymentsResource', () => {
  test('create builds POST path', async () => {
    const getAuth = mock(
      (): Promise<FakturoidAuth> => Promise.resolve({ accessToken: 't', slug: 's' }),
    );
    const requestMock = mock((opts: { method: string; path: string; body: any }) => {
      expect(opts.method).toBe('POST');
      expect(opts.path).toBe('/api/v3/accounts/s/invoices/12/payments.json');
      expect(opts.body).toEqual({ amount: 100 });
      return Promise.resolve({ id: 1 });
    });

    const http = { request: requestMock } as unknown as HttpClient;
    const resource = new InvoicePaymentsResource(http, getAuth);

    const result = await resource.create(12, { amount: 100 });
    expect(result.id).toBe(1);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  test('delete builds DELETE path', async () => {
    const getAuth = mock(
      (): Promise<FakturoidAuth> => Promise.resolve({ accessToken: 't', slug: 's' }),
    );
    const requestMock = mock((opts: { method: string; path: string }) => {
      expect(opts.method).toBe('DELETE');
      expect(opts.path).toBe('/api/v3/accounts/s/invoices/12/payments/34.json');
      return Promise.resolve();
    });

    const http = { request: requestMock } as unknown as HttpClient;
    const resource = new InvoicePaymentsResource(http, getAuth);

    await resource.delete(12, 34);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  test('createTaxDocument builds POST path', async () => {
    const getAuth = mock(
      (): Promise<FakturoidAuth> => Promise.resolve({ accessToken: 't', slug: 's' }),
    );
    const requestMock = mock((opts: { method: string; path: string }) => {
      expect(opts.method).toBe('POST');
      expect(opts.path).toBe('/api/v3/accounts/s/invoices/10/payments/20/create_tax_document.json');
      return Promise.resolve({ id: 20, tax_document_id: 99 });
    });

    const http = { request: requestMock } as unknown as HttpClient;
    const resource = new InvoicePaymentsResource(http, getAuth);

    const result = await resource.createTaxDocument(10, 20);
    expect(result.tax_document_id).toBe(99);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });
});
