import { useState, useCallback } from 'react';
import {
  pickFromCamera,
  pickFromGallery,
  promptPickImage,
  promptPickMultipleImages,
  PickedImage,
} from '../utils/imagePicker';
import {
  uploadImage,
  uploadImages,
  extractUploadedUrls,
  UploadModule,
  UploadResult,
} from '../utils/uploadFile';
import { showToast } from '../utils/toast';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PickSource = 'camera' | 'gallery' | 'prompt';

interface UseImageUploadOptions {
  moduleName:           UploadModule;
  onSuccess?:           (url: string, fileId: string) => void | Promise<void>;
  onError?:             (error: string) => void;
  showToastOnSuccess?:  boolean;
  showToastOnError?:    boolean;
  promptTitle?:         string;
}

interface UseImageUploadReturn {
  imageUrl:    string | null;
  fileId:      string | null;
  isUploading: boolean;
  error:       string | null;
  pickAndUpload: (source?: PickSource) => Promise<void>;
  uploadDirect:  (image: PickedImage) => Promise<UploadResult>;
  clearImage:    () => void;
  /** Bottom-sheet picker surface */
  pickerVisible:      boolean;
  openPicker:         () => void;
  closePicker:        () => void;
  handlePickerCamera: () => Promise<void>;
  handlePickerGallery:() => Promise<void>;
}

// ─── Single-image upload hook ─────────────────────────────────────────────────

export function useImageUpload({
  moduleName,
  onSuccess,
  onError,
  showToastOnSuccess = true,
  showToastOnError   = true,
  promptTitle        = 'Upload Photo',
}: UseImageUploadOptions): UseImageUploadReturn {
  const [imageUrl,      setImageUrl]      = useState<string | null>(null);
  const [fileId,        setFileId]        = useState<string | null>(null);
  const [isUploading,   setIsUploading]   = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const uploadDirect = useCallback(async (image: PickedImage): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);

    const result = await uploadImage(image, moduleName);

    if (result.success && result.url) {
      setImageUrl(result.url);
      setFileId(result.fileId ?? null);
      if (showToastOnSuccess) showToast('Image uploaded successfully', 'success');
      try {
        await onSuccess?.(result.url, result.fileId ?? '');
      } catch {
        // onSuccess is responsible for its own error toasts
      }
    } else {
      const msg = result.error ?? 'Upload failed';
      setError(msg);
      if (showToastOnError) showToast(msg, 'error');
      onError?.(msg);
    }

    setIsUploading(false);
    return result;
  }, [moduleName, onSuccess, onError, showToastOnSuccess, showToastOnError]);

  const pickAndUpload = useCallback(async (source: PickSource = 'prompt'): Promise<void> => {
    let picked: PickedImage | null = null;

    if (source === 'camera') {
      picked = await pickFromCamera(true);
    } else if (source === 'gallery') {
      const imgs = await pickFromGallery(1);
      picked = imgs[0] ?? null;
    } else {
      picked = await promptPickImage(promptTitle);
    }

    if (!picked) return;
    await uploadDirect(picked);
  }, [uploadDirect, promptTitle]);

  const clearImage = useCallback(() => {
    setImageUrl(null);
    setFileId(null);
    setError(null);
  }, []);

  const openPicker  = useCallback(() => setPickerVisible(true),  []);
  const closePicker = useCallback(() => setPickerVisible(false), []);

  const handlePickerCamera = useCallback(async () => {
    setPickerVisible(false);
    await new Promise<void>(r => setTimeout(r, 200));
    const img = await pickFromCamera(true);
    if (img) await uploadDirect(img);
  }, [uploadDirect]);

  const handlePickerGallery = useCallback(async () => {
    setPickerVisible(false);
    await new Promise<void>(r => setTimeout(r, 200));
    const imgs = await pickFromGallery(1);
    if (imgs[0]) await uploadDirect(imgs[0]);
  }, [uploadDirect]);

  return {
    imageUrl, fileId, isUploading, error,
    pickAndUpload, uploadDirect, clearImage,
    pickerVisible, openPicker, closePicker,
    handlePickerCamera, handlePickerGallery,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseMultiImageUploadOptions {
  moduleName:           UploadModule;
  maxImages?:           number;
  onSuccess?:           (urls: string[]) => void;
  onError?:             (error: string) => void;
  showToastOnSuccess?:  boolean;
  showToastOnError?:    boolean;
  promptTitle?:         string;
}

interface UseMultiImageUploadReturn {
  imageUrls:   string[];
  isUploading: boolean;
  error:       string | null;
  pickAndUploadMultiple: (source?: PickSource) => Promise<void>;
  uploadDirectBatch:     (images: PickedImage[]) => Promise<UploadResult[]>;
  removeImage:           (index: number) => void;
  clearImages:           () => void;
  /** Bottom-sheet picker surface */
  pickerVisible:       boolean;
  openPicker:          () => void;
  closePicker:         () => void;
  handlePickerCamera:  () => Promise<void>;
  handlePickerGallery: () => Promise<void>;
}

// ─── Multi-image upload hook ──────────────────────────────────────────────────

export function useMultiImageUpload({
  moduleName,
  maxImages          = 5,
  onSuccess,
  onError,
  showToastOnSuccess = true,
  showToastOnError   = true,
  promptTitle        = 'Add Photos',
}: UseMultiImageUploadOptions): UseMultiImageUploadReturn {
  const [imageUrls,     setImageUrls]     = useState<string[]>([]);
  const [isUploading,   setIsUploading]   = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const uploadDirectBatch = useCallback(
    async (images: PickedImage[]): Promise<UploadResult[]> => {
      if (images.length === 0) return [];

      setIsUploading(true);
      setError(null);

      const results = await uploadImages(images, moduleName);
      const urls    = extractUploadedUrls(results);
      const failed  = results.filter(r => !r.success).length;

      setIsUploading(false);

      if (urls.length > 0) {
        const updated = [...imageUrls, ...urls].slice(0, maxImages);
        setImageUrls(updated);
        if (showToastOnSuccess) {
          showToast(
            failed > 0
              ? `${urls.length} photo${urls.length !== 1 ? 's' : ''} uploaded (${failed} failed)`
              : `${urls.length} photo${urls.length !== 1 ? 's' : ''} uploaded`,
            failed > 0 ? 'info' : 'success',
          );
        }
        onSuccess?.(updated);
      } else {
        const msg = 'All uploads failed. Please try again.';
        setError(msg);
        if (showToastOnError) showToast(msg, 'error');
        onError?.(msg);
      }

      return results;
    },
    [moduleName, imageUrls, maxImages, onSuccess, onError, showToastOnSuccess, showToastOnError],
  );

  const pickAndUploadMultiple = useCallback(
    async (source: PickSource = 'prompt'): Promise<void> => {
      const remaining = maxImages - imageUrls.length;
      if (remaining <= 0) {
        showToast(`Maximum ${maxImages} photos allowed`, 'info');
        return;
      }

      let picked: PickedImage[] = [];

      if (source === 'camera') {
        const img = await pickFromCamera(false);
        picked = img ? [img] : [];
      } else if (source === 'gallery') {
        picked = await pickFromGallery(remaining);
      } else {
        picked = await promptPickMultipleImages(remaining, promptTitle);
      }

      if (picked.length === 0) return;
      await uploadDirectBatch(picked);
    },
    [imageUrls.length, maxImages, uploadDirectBatch, promptTitle],
  );

  const removeImage = useCallback((index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearImages = useCallback(() => {
    setImageUrls([]);
    setError(null);
  }, []);

  const openPicker  = useCallback(() => setPickerVisible(true),  []);
  const closePicker = useCallback(() => setPickerVisible(false), []);

  const handlePickerCamera = useCallback(async () => {
    setPickerVisible(false);
    await new Promise<void>(r => setTimeout(r, 200));
    const img = await pickFromCamera(false);
    if (img) await uploadDirectBatch([img]);
  }, [uploadDirectBatch]);

  const handlePickerGallery = useCallback(async () => {
    setPickerVisible(false);
    await new Promise<void>(r => setTimeout(r, 200));
    const remaining = maxImages - imageUrls.length;
    if (remaining <= 0) return;
    const imgs = await pickFromGallery(remaining);
    if (imgs.length > 0) await uploadDirectBatch(imgs);
  }, [uploadDirectBatch, maxImages, imageUrls.length]);

  return {
    imageUrls, isUploading, error,
    pickAndUploadMultiple, uploadDirectBatch, removeImage, clearImages,
    pickerVisible, openPicker, closePicker,
    handlePickerCamera, handlePickerGallery,
  };
}
