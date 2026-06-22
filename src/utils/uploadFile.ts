import apiClient from '../api/client';
import type { PickedImage } from './imagePicker';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UploadModule =
  | 'appuser'
  | 'customer'
  | 'vehicle'
  | 'jobcard'
  | 'estimate';

export interface UploadResult {
  success: boolean;
  url?:    string;
  fileId?: string;
  error?:  string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const APP_NAME    = 'garageosapp.hanaplatform.com';
const UPLOAD_PATH = '/api/v1/files/upload';

// ─── Core upload function ─────────────────────────────────────────────────────

/**
 * Upload a single image to the Hana file service.
 *
 * Auth token is injected automatically by the apiClient interceptor — no manual
 * token handling needed.
 *
 * @param image      The picked image (uri, type, fileName from imagePicker.ts)
 * @param moduleName Context module: appuser | customer | vehicle | jobcard | estimate
 */
export async function uploadImage(
  image:      PickedImage,
  moduleName: UploadModule = 'appuser',
): Promise<UploadResult> {
  try {
    const formData = new FormData();

    // React Native FormData requires the special {uri, type, name} object shape.
    // The cast to `any` is necessary because the RN FormData type diverges from
    // the browser spec — this is the standard pattern in React Native.
    formData.append('file', {
      uri:  image.uri,
      type: image.type  ?? 'image/jpeg',
      name: image.fileName ?? `upload_${Date.now()}.jpg`,
    } as any);

    formData.append('moduleName', moduleName);
    formData.append('appName',    APP_NAME);
    formData.append('optimize',   'false');

    const { data } = await apiClient.post<{
      status: string;
      data:   { fileId: string; url: string; moduleName: string };
    }>(UPLOAD_PATH, formData, {
      headers: {
        // Overrides the default application/json — Axios sets the boundary
        // automatically when the value is 'multipart/form-data'.
        'Content-Type': 'multipart/form-data',
      },
      // Increase timeout for file uploads on slow networks
      timeout: 30_000,
    });

    if (data?.status === 'success' && data?.data?.url) {
      return {
        success: true,
        url:     data.data.url,
        fileId:  data.data.fileId,
      };
    }

    return { success: false, error: 'Unexpected response from upload server' };

  } catch (err: any) {
    const message = err?.message ?? 'Upload failed. Please try again.';
    return { success: false, error: message };
  }
}

/**
 * Upload multiple images in sequence.
 * Returns an array of results in the same order as the input images.
 * Upload continues even if individual images fail.
 */
export async function uploadImages(
  images:     PickedImage[],
  moduleName: UploadModule = 'jobcard',
): Promise<UploadResult[]> {
  return Promise.all(images.map(img => uploadImage(img, moduleName)));
}

/** Extract successful URLs from a batch upload result array. */
export function extractUploadedUrls(results: UploadResult[]): string[] {
  return results.filter(r => r.success && r.url).map(r => r.url!);
}
