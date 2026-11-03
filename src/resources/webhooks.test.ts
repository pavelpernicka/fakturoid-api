import { describe, expect, mock, test } from 'bun:test';
import type { HttpClient } from '../http/http-client.js';
import type { FakturoidAuth } from '../types/common.js';
import { WebhooksResource } from './webhooks.js';

describe('WebhooksResource', () => {
  test('list builds path with optional page', async () => {
    const getAuth = mock(
      (): Promise<FakturoidAuth> => Promise.resolve({ accessToken: 't', slug: 's' }),
    );
    const requestMock = mock((opts: { method: string; path: string; query?: URLSearchParams }) => {
      expect(opts.method).toBe('GET');
      expect(opts.path).toBe('/api/v3/accounts/s/webhooks.json');
      expect(opts.query?.get('page')).toBe('1');
      return Promise.resolve([]);
    });

    const http = { request: requestMock } as unknown as HttpClient;
    const resource = new WebhooksResource(http, getAuth);

    await resource.list({ page: 1 });
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  test('get builds GET path', async () => {
    const getAuth = mock(
      (): Promise<FakturoidAuth> => Promise.resolve({ accessToken: 't', slug: 's' }),
    );
    const requestMock = mock((opts: { method: string; path: string }) => {
      expect(opts.method).toBe('GET');
      expect(opts.path).toBe('/api/v3/accounts/s/webhooks/10.json');
      return Promise.resolve({ id: 10 });
    });

    const http = { request: requestMock } as unknown as HttpClient;
    const resource = new WebhooksResource(http, getAuth);

    await resource.get(10);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  test('create builds POST path', async () => {
    const getAuth = mock(
      (): Promise<FakturoidAuth> => Promise.resolve({ accessToken: 't', slug: 's' }),
    );
    const requestMock = mock((opts: { method: string; path: string; body: any }) => {
      expect(opts.method).toBe('POST');
      expect(opts.path).toBe('/api/v3/accounts/s/webhooks.json');
      return Promise.resolve({ id: 11 });
    });

    const http = { request: requestMock } as unknown as HttpClient;
    const resource = new WebhooksResource(http, getAuth);

    await resource.create({ events: ['invoice_created'], webhook_url: 'http' });
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  test('update builds PATCH path', async () => {
    const getAuth = mock(
      (): Promise<FakturoidAuth> => Promise.resolve({ accessToken: 't', slug: 's' }),
    );
    const requestMock = mock((opts: { method: string; path: string; body: any }) => {
      expect(opts.method).toBe('PATCH');
      expect(opts.path).toBe('/api/v3/accounts/s/webhooks/11.json');
      return Promise.resolve({ id: 11 });
    });

    const http = { request: requestMock } as unknown as HttpClient;
    const resource = new WebhooksResource(http, getAuth);

    await resource.update(11, { active: false });
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  test('delete builds DELETE path', async () => {
    const getAuth = mock(
      (): Promise<FakturoidAuth> => Promise.resolve({ accessToken: 't', slug: 's' }),
    );
    const requestMock = mock((opts: { method: string; path: string }) => {
      expect(opts.method).toBe('DELETE');
      expect(opts.path).toBe('/api/v3/accounts/s/webhooks/11.json');
      return Promise.resolve();
    });

    const http = { request: requestMock } as unknown as HttpClient;
    const resource = new WebhooksResource(http, getAuth);

    await resource.delete(11);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  test('getFailedDeliveries builds GET path with failed_deliveries_uuid', async () => {
    const getAuth = mock(
      (): Promise<FakturoidAuth> => Promise.resolve({ accessToken: 't', slug: 's' }),
    );
    const requestMock = mock((opts: { method: string; path: string }) => {
      expect(opts.method).toBe('GET');
      expect(opts.path).toBe('/api/v3/accounts/s/webhooks/some-uuid/failed_deliveries.json');
      return Promise.resolve([]);
    });

    const http = { request: requestMock } as unknown as HttpClient;
    const resource = new WebhooksResource(http, getAuth);

    await resource.getFailedDeliveries('some-uuid');
    expect(requestMock).toHaveBeenCalledTimes(1);
  });
});
