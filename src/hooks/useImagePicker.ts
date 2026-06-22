import { useState, useCallback } from 'react';
import { pickFromCamera, pickFromGallery, PickedImage } from '../utils/imagePicker';

interface UseImagePickerOptions {
  maxImages?: number;
  onPicked:   (images: PickedImage[]) => void;
}

interface UseImagePickerReturn {
  visible:       boolean;
  open:          () => void;
  close:         () => void;
  handleCamera:  () => Promise<void>;
  handleGallery: () => Promise<void>;
}

/**
 * Manages bottom-sheet visibility + invokes camera/gallery pickers.
 * Calls `onPicked` with the selected images; camera always yields [1],
 * gallery yields up to `maxImages`.
 *
 * Use this when the screen manages its own PickedImage[] state (e.g. deferred
 * upload at submit time). For immediate-upload flows, use useImageUpload /
 * useMultiImageUpload which expose the same picker surface.
 */
export function useImagePicker({
  maxImages = 1,
  onPicked,
}: UseImagePickerOptions): UseImagePickerReturn {
  const [visible, setVisible] = useState(false);

  const open  = useCallback(() => setVisible(true),  []);
  const close = useCallback(() => setVisible(false), []);

  const handleCamera = useCallback(async () => {
    setVisible(false);
    await new Promise<void>(r => setTimeout(r, 200));
    const img = await pickFromCamera(false);
    if (img) onPicked([img]);
  }, [onPicked]);

  const handleGallery = useCallback(async () => {
    setVisible(false);
    await new Promise<void>(r => setTimeout(r, 200));
    const imgs = await pickFromGallery(maxImages);
    if (imgs.length > 0) onPicked(imgs);
  }, [maxImages, onPicked]);

  return { visible, open, close, handleCamera, handleGallery };
}
