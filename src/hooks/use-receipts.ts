import { useCallback, useState } from 'react';
import { useAuth } from '@/lib/auth-store';
import { ApiError } from '@/lib/api';
import { energyInvoices } from '@/lib/endpoints';
import type { FuelInvoice, FuelInvoiceListResponse } from '@/lib/types';

export type ReceiptsState = {
  invoices: FuelInvoice[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  /** `true` while an upload is in flight. */
  isUploading: boolean;
  uploadError: string | null;
  refresh: () => Promise<void>;
  load: () => Promise<void>;
  upload: (params: {
    uri: string;
    name: string;
    type: string;
    invoiceDate?: string;
  }) => Promise<FuelInvoice | null>;
  remove: (id: number) => Promise<void>;
  clearUploadError: () => void;
};

/**
 * Owns the fuel invoice collection: listing, uploading a photographed receipt
 * and deleting one. The upload posts multipart/form-data, which is the shape
 * `POST /api/v1/fuel-invoices` expects (`image`, optional `invoice_date`).
 */
export function useReceipts(): ReceiptsState {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState<FuelInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const applyResponse = useCallback((response: FuelInvoiceListResponse) => {
    setInvoices(response.invoices.data);
  }, []);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      applyResponse(await energyInvoices.list(token));
    } catch (loadError) {
      setError(loadError instanceof ApiError ? loadError.message : 'Could not load your receipts.');
    } finally {
      setIsLoading(false);
    }
  }, [applyResponse, token]);

  const refresh = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsRefreshing(true);

    try {
      applyResponse(await energyInvoices.list(token));
      setError(null);
    } catch (refreshError) {
      setError(
        refreshError instanceof ApiError ? refreshError.message : 'Could not refresh receipts.',
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [applyResponse, token]);

  const upload = useCallback<ReceiptsState['upload']>(
    async ({ uri, name, type, invoiceDate }) => {
      if (!token) {
        return null;
      }

      setIsUploading(true);
      setUploadError(null);

      try {
        const form = new FormData();
        // React Native accepts the { uri, name, type } shape for file parts.
        form.append('image', { uri, name, type } as unknown as Blob);
        form.append('invoice_date', invoiceDate ?? new Date().toISOString().slice(0, 10));

        const response = await energyInvoices.create(token, form);

        setInvoices((current) => [response.invoice, ...current]);

        return response.invoice;
      } catch (uploadFailure) {
        const message =
          uploadFailure instanceof ApiError
            ? (uploadFailure.fieldError('image') ?? uploadFailure.message)
            : 'The receipt could not be uploaded.';

        setUploadError(message);

        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [token],
  );

  const remove = useCallback(
    async (id: number) => {
      if (!token) {
        return;
      }

      const previous = invoices;
      setInvoices((current) => current.filter((invoice) => invoice.id !== id));

      try {
        await energyInvoices.remove(token, id);
      } catch (deleteError) {
        // Restore the row when the API rejects the deletion.
        setInvoices(previous);
        setError(
          deleteError instanceof ApiError ? deleteError.message : 'Could not delete the receipt.',
        );
      }
    },
    [invoices, token],
  );

  return {
    invoices,
    isLoading,
    isRefreshing,
    error,
    isUploading,
    uploadError,
    refresh,
    load,
    upload,
    remove,
    clearUploadError: () => setUploadError(null),
  };
}
